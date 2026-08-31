from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

import db
from auth import CurrentUser, get_current_user
from config import settings
from models import UserOut
from routers import github, projects

app = FastAPI(title="Release Demo Recorder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


@app.get("/me", response_model=UserOut, tags=["auth"])
def me(user: CurrentUser = Depends(get_current_user)):
    db.ensure_user_profile(user.sub, user.email)
    profile = db.get_user_profile(user.sub)
    connected = bool(profile and profile.get("github_installation_id"))
    return UserOut(sub=user.sub, email=user.email, github_connected=connected)


app.include_router(projects.router)
app.include_router(github.router)

# Mangum adapts the FastAPI app to the Lambda/API Gateway event model.
handler = Mangum(app)
