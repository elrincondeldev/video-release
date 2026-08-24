import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

from config import settings

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


def _project_item(sub: str, project_id: str, data: dict, created_at: str) -> dict:
    item = {
        "PK": f"USER#{sub}",
        "SK": f"PROJECT#{project_id}",
        "type": "PROJECT",
        "id": project_id,
        "created_at": created_at,
        "name": data["name"],
        "description": data.get("description"),
        "repo_url": data.get("repo_url"),
        "repo_full_name": data.get("repo_full_name"),
        "deploy_url": data.get("deploy_url"),
    }
    # GSI1 lets a GitHub webhook resolve repo_full_name -> project (Phase 2).
    if data.get("repo_full_name"):
        item["GSI1PK"] = f"REPO#{data['repo_full_name']}"
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
