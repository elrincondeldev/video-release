set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF="$ROOT/infra/terraform/envs/prod"

REGION="eu-south-2"
USER_POOL_ID="eu-south-2_x1bZDCgxE"
CLIENT_ID="1d7d0cfb68i6b844asppavpfou"

echo "==> 1/4 terraform apply (Lambda + API Gateway)"
terraform -chdir="$TF" apply -auto-approve

API_URL="$(terraform -chdir="$TF" output -raw api_url)"
BUCKET="$(terraform -chdir="$TF" output -raw frontend_bucket)"
DIST_ID="$(terraform -chdir="$TF" output -raw cloudfront_distribution_id)"
echo "    api_url = $API_URL"

echo "==> 2/4 build frontend against $API_URL"
cd "$ROOT/frontend"
VITE_API_URL="$API_URL" \
VITE_AWS_REGION="$REGION" \
VITE_COGNITO_USER_POOL_ID="$USER_POOL_ID" \
VITE_COGNITO_CLIENT_ID="$CLIENT_ID" \
npm run build

echo "==> 3/4 sync dist/ to s3://$BUCKET"
aws s3 sync dist/ "s3://$BUCKET" --delete

echo "==> 4/4 invalidate CloudFront $DIST_ID"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" >/dev/null

FRONTEND_URL="$(terraform -chdir="$TF" output -raw frontend_url)"
echo ""
echo "Done."
echo "  API:      $API_URL/health"
echo "  Frontend: $FRONTEND_URL"
