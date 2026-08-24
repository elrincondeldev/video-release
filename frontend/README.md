# Frontend (React + TypeScript + Tailwind + Motion)

SPA with custom Cognito auth (Amplify) and project CRUD.

Stack: React 18, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), Motion
(`motion/react`) for animations.

## Environment variables

Create a `.env` file (gitignored) with:

```
VITE_API_URL=http://localhost:8000
VITE_AWS_REGION=eu-south-2
VITE_COGNITO_USER_POOL_ID=eu-south-2_x1bZDCgxE
VITE_COGNITO_CLIENT_ID=1d7d0cfb68i6b844asppavpfou
```

For production, set `VITE_API_URL` to the API Gateway URL (`terraform output api_url`)
before running `npm run build`.

## Commands

```
npm install
npm run dev      # local dev server on http://localhost:5173
npm run build    # production build into dist/
```

## Deploy

Upload `dist/` to the frontend S3 bucket and invalidate CloudFront:

```
aws s3 sync dist/ s3://rdr-prod-frontend --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```
