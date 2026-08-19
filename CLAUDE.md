# CLAUDE.md — Release Demo Recorder

Guidance for AI agents working in this repository. Read this before making changes.

## What this product is

A tool that automatically records professional demo videos of an app's new
features every time its GitHub repo publishes a release. The user connects their
GitHub (via a GitHub App) and their deployed URL; on each `release published`
event, the system records a video (human-like cursor, subtitles, highlights)
navigating the deployed app, stores it, and lets the user watch/download it.

## Golden rules

- **Work in phases.** Stop at the end of each phase and show the result before
  continuing. Do not jump ahead.
- **Ask before any architecture or cost decision.** Cost is a hard constraint.
- **Cost ≈ $0 at rest.** Maximize AWS free tier. Two "silent killers" are banned
  by design: **NAT Gateway** (~$32/mo) and **ALB** (~$16/mo). Do not introduce them.
- **Explain in plain language.** The maintainer is learning AWS/infra. Define any
  new term in one line. User-facing text and explanations are in **English**.
- **Minimal comments in code.** Only comment the non-obvious (a "why", a gotcha).
  No narration comments. **Code comments are in English** (industry standard).
- **This file (CLAUDE.md) is in English.** User-facing UI text and chat
  explanations are in Spanish; code comments and docs-as-code are in English.

## Fixed decisions (do not re-litigate)

- Target apps are **public** in v1 (routes reachable without login). Test
  credentials per project are a fast-follow, not v1.
- **AI stays on Replicate** (`meta/meta-llama-3-70b-instruct`), behind a `Planner`
  interface so it can move to Bedrock later without touching the recorder.
- **IaC = Terraform**, packaging = **Docker**, images in **ECR**.
- **Region: eu-south-2** (Spain). **Prefix: `rdr`**. Single env: `prod`.
- No existing MVP: the recording engine is **built from scratch** in Phases 3–4.

## Target architecture (v1, serverless, scale-to-zero)

- **Frontend**: React + Vite SPA on S3 + CloudFront.
- **Auth**: AWS Cognito (User Pool, OIDC). Backend validates JWT via JWKS.
- **GitHub**: one **GitHub App** (not an OAuth App). Permissions: Contents:read,
  Metadata:read. Event: Release. Signed webhook. Gives release webhooks for all
  installed repos + installation tokens to read notes and the tag-to-tag diff.
- **API + Webhook**: FastAPI on Lambda (Mangum) behind API Gateway HTTP API. No ALB.
- **Queue**: SQS + DLQ.
- **Worker orchestration**: a Lambda _dispatcher_ consumes SQS and launches one
  Fargate task per message (`ecs:RunTask`, Fargate Spot). Scale 0→N with a
  configurable concurrency cap. Fargate in a **public subnet** with a strict
  security group (no NAT).
- **Worker**: Docker image based on `mcr.microsoft.com/playwright/python` + ffmpeg
  - our code. One Chromium per task, guaranteed vCPU (fluidity, RNF-2).
- **DB**: DynamoDB single-table.
- **Videos**: private S3, served via presigned URLs.
- **Secrets**: SSM Parameter Store (SecureString). Not Secrets Manager (cost).

### Release → video flow

`release` on GitHub → webhook → API Gateway → Lambda (validate signature, write
record to DynamoDB, enqueue to SQS) → Lambda dispatcher → Fargate worker (read
notes + diff from GitHub → ask Replicate for a script → navigate the app and
record → upload mp4 to S3 → mark `done` in DynamoDB) → user watches/downloads via
presigned URL.

## Data model (DynamoDB single-table)

| Entity    | PK                                                           | SK                 | Notes                                                                    |
| --------- | ------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------ |
| User      | `USER#{cognitoSub}`                                          | `PROFILE`          | email, github_installation_id                                            |
| Project   | `USER#{cognitoSub}`                                          | `PROJECT#{id}`     | name, description, repo_url, repo_full_name, deploy_url                  |
| Recording | `PROJECT#{id}`                                               | `REC#{ts}#{recId}` | release_tag, status, target_routes[], plan_json, s3_key, duration, error |
| GSI1      | `REPO#{repo_full_name}` → resolves webhook to `PROJECT#{id}` |                    | attributes GSI1PK / GSI1SK                                               |

`auth_config` (encrypted test credentials) is reserved on Project for the
login-app fast-follow; unused in v1.

## Key challenge (RF-9): hit the right route

The changed feature may not be on the home page. In the planning phase the worker
must: read release notes + changed files (GitHub compare API between previous and
new tag) + discover routes (sitemap.xml or a shallow crawl) + file→route heuristic,
then ask the AI for a **multi-page** script. The step schema includes a `navigate`
action to a concrete route (`deploy_url + path`).

## Repository layout

```
app/            (planned) recording engine — built in Phases 3–4
frontend/       (planned) React + Vite SPA — Phase 1
api/            (planned) FastAPI + Mangum — Phase 1
worker/         (planned) Fargate worker code — Phase 3
docker/         api.Dockerfile, worker.Dockerfile
docs/           REQUISITOS_v1.md (source of truth), arquitectura.html
infra/terraform/
  bootstrap/    one-time: S3 state bucket + lock table
  modules/      network, cognito, dynamodb, s3_videos, s3_frontend, ecr, sqs, ssm, iam
  envs/prod/    composes the modules; this is what you apply
```

## Terraform conventions

- Module input: `name_prefix` (e.g. `rdr-prod`). Resources named `${name_prefix}-<thing>`.
- Remote state: S3 backend + DynamoDB lock (see `bootstrap/`).
- Provider `aws ~> 5.0`, Terraform `>= 1.6`.
- `default_tags`: Project, Environment, ManagedBy.
- Least-privilege IAM: each role's inline policy scoped to concrete ARNs.
- Secrets: SSM params created with `CHANGE_ME` + `ignore_changes = [value]`; real
  values set out-of-band with `aws ssm put-parameter`.
- Lambdas run **outside** the VPC on purpose. Only Fargate uses the VPC.
- Never commit `*.tfstate`, `*.pem`, or `.env` (see `.gitignore`).

## Phase roadmap

- **Phase 0** — Terraform base (Cognito, DynamoDB, S3, ECR, SQS, IAM, SSM) + Dockerfiles. ✅ current
- **Phase 1** — Auth + Projects: React login (Cognito), project CRUD, API on Lambda.
- **Phase 2** — GitHub App: register, install, callback, receive webhooks.
- **Phase 3** — Recording pipeline: dispatcher + Fargate worker + recorder (`navigate`).
- **Phase 4** — Route targeting (RF-9): diff + route discovery + multi-page prompts.
- **Phase 5** — Storage + viewer: S3 + presigned URLs + player/download in the front.
- **Phase 6** — Robustness + cost: DLQ, dead-job reconciliation, concurrency cap,
  AWS Budgets, CloudWatch metrics.

## Working with the codebase

- Source of truth is `docs/REQUISITOS_v1.md`. Keep changes consistent with it.
- Prefer extending existing modules over adding new services (each service = cost/ops).
- When a change spans phases, stop at the phase boundary and summarize.
