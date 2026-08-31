from pydantic import BaseModel, Field, HttpUrl


class ProjectCreate(BaseModel):
    repo_url: HttpUrl
    deploy_url: HttpUrl
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=1000)


class ProjectUpdate(BaseModel):
    repo_url: HttpUrl | None = None
    deploy_url: HttpUrl | None = None
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=1000)


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
    github_connected: bool = False


class GithubLink(BaseModel):
    installation_id: str
