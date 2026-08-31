#!/usr/bin/env bash
# Build the API image, push to ECR, apply infra, and refresh the Lambda code.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF="$ROOT/infra/terraform/envs/prod"

REGION="eu-south-2"
ACCOUNT="447393541483"
REGISTRY="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"
REPO="$REGISTRY/rdr-prod-api"

echo "==> 1/4 ECR login"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

echo "==> 2/4 build + push (arm64)"
docker build --platform linux/arm64 -f "$ROOT/docker/api.Dockerfile" -t "${REPO}:latest" "$ROOT"
docker push "${REPO}:latest"

echo "==> 3/4 terraform apply"
terraform -chdir="$TF" apply -auto-approve

# terraform keeps the same image tag, so force the function to pull the new image.
echo "==> 4/4 update Lambda code"
aws lambda update-function-code --function-name rdr-prod-api \
  --image-uri "${REPO}:latest" --region "$REGION" >/dev/null
aws lambda wait function-updated --function-name rdr-prod-api --region "$REGION"

echo "Done. API: $(terraform -chdir="$TF" output -raw api_url)"
