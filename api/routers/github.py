import hashlib
import hmac
import json

import boto3
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

import db
from auth import CurrentUser, get_current_user
from config import settings
from models import GithubLink
from secret_store import get_secret

router = APIRouter(tags=["github"])
_sqs = boto3.client("sqs", region_name=settings.region)


def _verify_signature(body: bytes, signature: str | None) -> None:
    secret = get_secret(settings.github_webhook_secret_param).encode()
    expected = "sha256=" + hmac.new(secret, body, hashlib.sha256).hexdigest()
    if not signature or not hmac.compare_digest(expected, signature):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid signature")


@router.post("/webhooks/github")
async def github_webhook(
    request: Request,
    x_github_event: str = Header(default=""),
    x_hub_signature_256: str | None = Header(default=None),
):
    body = await request.body()
    _verify_signature(body, x_hub_signature_256)
    payload = json.loads(body)

    if x_github_event != "release" or payload.get("action") != "published":
        return {"ok": True}

    repo = payload["repository"]["full_name"]
    project = db.get_project_by_repo(repo)
    if project is None:
        return {"ignored": "no project for repo"}

    release = payload["release"]
    rec = db.create_recording(
        project["id"],
        {
            "release_tag": release.get("tag_name"),
            "release_name": release.get("name"),
            "repo_full_name": repo,
        },
    )
    _sqs.send_message(
        QueueUrl=settings.sqs_queue_url,
        MessageBody=json.dumps(
            {
                "project_id": project["id"],
                "recording_sk": rec["SK"],
                "recording_id": rec["id"],
                "deploy_url": project.get("deploy_url"),
                "repo_full_name": repo,
                "release_tag": release.get("tag_name"),
                "release_name": release.get("name"),
            }
        ),
    )
    return {"queued": rec["id"]}


@router.post("/github/link")
def link_github(body: GithubLink, user: CurrentUser = Depends(get_current_user)):
    db.set_user_installation(user.sub, body.installation_id)
    return {"linked": True}
