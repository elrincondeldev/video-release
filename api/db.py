import re
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

from config import settings

_REPO_RE = re.compile(r"github\.com[/:]([^/]+/[^/]+?)(?:\.git)?/?$", re.IGNORECASE)


def parse_repo_full_name(repo_url: str | None) -> str | None:
    """Extract 'owner/repo' from a GitHub URL (https or ssh)."""
    if not repo_url:
        return None
    match = _REPO_RE.search(repo_url.strip())
    return match.group(1) if match else None

_table = boto3.resource("dynamodb", region_name=settings.region).Table(
    settings.ddb_table
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_user_profile(sub: str, email: str | None) -> None:
    _table.update_item(
        Key={"PK": f"USER#{sub}", "SK": "PROFILE"},
        UpdateExpression="SET #t = :t, email = if_not_exists(email, :e), created_at = if_not_exists(created_at, :c)",
        ExpressionAttributeNames={"#t": "type"},
        ExpressionAttributeValues={":t": "USER", ":e": email, ":c": _now()},
    )


def get_user_profile(sub: str) -> dict | None:
    resp = _table.get_item(Key={"PK": f"USER#{sub}", "SK": "PROFILE"})
    return resp.get("Item")


def set_user_installation(sub: str, installation_id: str) -> None:
    _table.update_item(
        Key={"PK": f"USER#{sub}", "SK": "PROFILE"},
        UpdateExpression="SET github_installation_id = :i",
        ExpressionAttributeValues={":i": str(installation_id)},
    )


def _project_item(sub: str, project_id: str, data: dict, created_at: str) -> dict:
    repo_full_name = parse_repo_full_name(data.get("repo_url"))
    # Fall back to the repo name when the user leaves the name blank.
    name = data.get("name") or (repo_full_name.split("/")[-1] if repo_full_name else "Proyecto")
    item = {
        "PK": f"USER#{sub}",
        "SK": f"PROJECT#{project_id}",
        "type": "PROJECT",
        "id": project_id,
        "created_at": created_at,
        "name": name,
        "description": data.get("description"),
        "repo_url": data.get("repo_url"),
        "repo_full_name": repo_full_name,
        "deploy_url": data.get("deploy_url"),
    }
    # GSI1 lets a GitHub webhook resolve repo_full_name -> project (Phase 2).
    if repo_full_name:
        item["GSI1PK"] = f"REPO#{repo_full_name}"
        item["GSI1SK"] = f"PROJECT#{project_id}"
    return item


def create_project(sub: str, data: dict) -> dict:
    project_id = uuid.uuid4().hex
    item = _project_item(sub, project_id, data, _now())
    _table.put_item(Item=item)
    return item


def list_projects(sub: str) -> list[dict]:
    resp = _table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{sub}")
        & Key("SK").begins_with("PROJECT#")
    )
    return resp.get("Items", [])


def get_project(sub: str, project_id: str) -> dict | None:
    resp = _table.get_item(
        Key={"PK": f"USER#{sub}", "SK": f"PROJECT#{project_id}"}
    )
    return resp.get("Item")


def update_project(sub: str, project_id: str, data: dict) -> dict | None:
    existing = get_project(sub, project_id)
    if existing is None:
        return None
    merged = {**existing, **{k: v for k, v in data.items() if v is not None}}
    item = _project_item(sub, project_id, merged, existing["created_at"])
    _table.put_item(Item=item)
    return item


def delete_project(sub: str, project_id: str) -> bool:
    resp = _table.delete_item(
        Key={"PK": f"USER#{sub}", "SK": f"PROJECT#{project_id}"},
        ReturnValues="ALL_OLD",
    )
    return "Attributes" in resp


def get_project_by_repo(repo_full_name: str) -> dict | None:
    resp = _table.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"REPO#{repo_full_name}"),
        Limit=1,
    )
    items = resp.get("Items", [])
    return items[0] if items else None


def create_recording(project_id: str, data: dict) -> dict:
    rec_id = uuid.uuid4().hex
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    item = {
        "PK": f"PROJECT#{project_id}",
        "SK": f"REC#{ts}#{rec_id}",
        "type": "RECORDING",
        "id": rec_id,
        "status": "queued",
        "created_at": _now(),
        **data,
    }
    _table.put_item(Item=item)
    return item
