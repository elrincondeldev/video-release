import json
import urllib.request
from functools import lru_cache

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

from config import settings

_bearer = HTTPBearer(auto_error=True)


@lru_cache(maxsize=1)
def _jwks() -> dict:
    url = f"{settings.cognito_issuer}/.well-known/jwks.json"
    with urllib.request.urlopen(url, timeout=5) as resp:  # noqa: S310
        return json.loads(resp.read())


class CurrentUser:
    def __init__(self, sub: str, email: str | None):
        self.sub = sub
        self.email = email


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> CurrentUser:
    token = creds.credentials
    try:
        kid = jwt.get_unverified_header(token).get("kid")
        key = next((k for k in _jwks()["keys"] if k["kid"] == kid), None)
        if key is None:
            raise JWTError("unknown kid")

        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.cognito_client_id,
            issuer=settings.cognito_issuer,
        )
    except (JWTError, KeyError, StopIteration) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if claims.get("token_use") != "id":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expected an ID token",
        )

    return CurrentUser(sub=claims["sub"], email=claims.get("email"))
