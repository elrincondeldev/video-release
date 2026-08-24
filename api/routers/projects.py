from fastapi import APIRouter, Depends, HTTPException, status

import db
from auth import CurrentUser, get_current_user
from models import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(user: CurrentUser = Depends(get_current_user)):
    return db.list_projects(user.sub)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate, user: CurrentUser = Depends(get_current_user)
):
    # mode="json" renders HttpUrl as str, which is what DynamoDB stores.
    return db.create_project(user.sub, body.model_dump(mode="json"))


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, user: CurrentUser = Depends(get_current_user)):
    item = db.get_project(user.sub, project_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return item


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    body: ProjectUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    item = db.update_project(
        user.sub, project_id, body.model_dump(mode="json", exclude_unset=True)
    )
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return item


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str, user: CurrentUser = Depends(get_current_user)
):
    if not db.delete_project(user.sub, project_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
