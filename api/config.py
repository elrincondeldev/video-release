import os


class Settings:
    region: str = os.environ.get("AWS_REGION", "eu-south-2")
    ddb_table: str = os.environ.get("DDB_TABLE", "rdr-prod-main")
    cognito_issuer: str = os.environ.get(
        "COGNITO_ISSUER",
        "https://cognito-idp.eu-south-2.amazonaws.com/eu-south-2_x1bZDCgxE",
    )
    cognito_client_id: str = os.environ.get(
        "COGNITO_CLIENT_ID", "1d7d0cfb68i6b844asppavpfou"
    )
    cors_origins: list[str] = os.environ.get(
        "CORS_ORIGINS",
        "https://d32bl6ndtgy703.cloudfront.net,http://localhost:5173",
    ).split(",")

    sqs_queue_url: str = os.environ.get(
        "SQS_QUEUE_URL",
        "https://sqs.eu-south-2.amazonaws.com/447393541483/rdr-prod-recording",
    )
    github_webhook_secret_param: str = os.environ.get(
        "GITHUB_WEBHOOK_SECRET_PARAM", "/rdr-prod/github_webhook_secret"
    )


settings = Settings()
