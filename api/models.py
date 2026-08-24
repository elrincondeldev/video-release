from pydantic import BaseModel, Field, HttpUrl


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    repo_url: HttpUrl | None = None
    repo_full_name: str | None = Field(default=None, description="owner/repo")
    deploy_url: HttpUrl | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    repo_url: HttpUrl | None = None
    repo_full_name: str | None = None
    deploy_url: HttpUrl | None = None


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    repo_url: str | None = None
    repo_full_name: str | None = None
    deploy_url: str | None = None
    created_at: str


class UserOut(BaseModel):
    sub: str
    email: str | None = None
