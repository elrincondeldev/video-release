from functools import lru_cache

import boto3

from config import settings

_ssm = boto3.client("ssm", region_name=settings.region)


@lru_cache(maxsize=8)
def get_secret(name: str) -> str:
    resp = _ssm.get_parameter(Name=name, WithDecryption=True)
    return resp["Parameter"]["Value"]
