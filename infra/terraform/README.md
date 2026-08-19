# Infraestructura (Terraform) — Fase 0

Base de infraestructura en AWS para *Release Demo Recorder*. Todo serverless, con
coste ≈ $0 en reposo. Región por defecto: **eu-south-2** (España).

## Estructura

```
infra/terraform/
├── bootstrap/        Se aplica UNA vez: crea el bucket S3 del estado + tabla de bloqueo.
├── modules/          Piezas reutilizables (no se aplican solas):
│   ├── network/        VPC mínima + subred pública + IGW (solo para el worker Fargate).
│   ├── cognito/        User Pool + Hosted UI + app client (SPA).
│   ├── dynamodb/       Tabla única (single-table) + índice GSI1.
│   ├── s3_videos/      Bucket privado de vídeos (URLs prefirmadas).
│   ├── s3_frontend/    Bucket web + CloudFront (OAC) para la SPA.
│   ├── ecr/            Repos de imágenes Docker: api y worker.
│   ├── sqs/            Cola de grabación + DLQ.
│   ├── ssm/            Parámetros SecureString (secretos).
│   └── iam/            Roles de mínimo privilegio (lambda_api, dispatcher, worker, ejecución ECS).
└── envs/prod/        Entorno que compone los módulos. Es lo que se aplica.
```

## Requisitos

- Terraform ≥ 1.6
- AWS CLI configurado con un perfil (`aws configure list-profiles`).
  Exporta el perfil antes de operar: `export AWS_PROFILE=<tu-perfil>`

## Paso a paso

### 1) Bootstrap del estado (solo la primera vez)

```bash
cd infra/terraform/bootstrap
terraform init
terraform apply
terraform output backend_config   # copia este bloque
```

### 2) Configura el backend del entorno

Pega el bloque de `backend_config` en `envs/prod/backend.tf` (o sustituye
`REEMPLAZA_ACCOUNT_ID` por tu Account ID).

### 3) Aplica el entorno prod

```bash
cd ../envs/prod
terraform init      # migra el estado al bucket S3
terraform plan      # revisa lo que se va a crear
terraform apply
```

### 4) Rellena los secretos (fuera de Terraform)

Los parámetros SSM se crean con el valor `CHANGE_ME`. Pon los reales:

```bash
aws ssm put-parameter --name "/rdr-prod/replicate_api_token"    --type SecureString --value "<token>"      --overwrite
aws ssm put-parameter --name "/rdr-prod/github_webhook_secret"  --type SecureString --value "<secreto>"    --overwrite
aws ssm put-parameter --name "/rdr-prod/github_app_private_key" --type SecureString --value "$(cat key.pem)" --overwrite
```

## Destruir todo

```bash
cd envs/prod && terraform destroy
cd ../../bootstrap && terraform destroy   # borra el bucket del estado al final
```

## Notas de diseño

- **Lambdas fuera de la VPC**: alcanzan DynamoDB/SQS/S3/SSM por la red pública de
  AWS. Así evitamos el NAT Gateway (~32 $/mes) y el arranque en frío por ENI.
- **Secretos**: nunca se guardan en el código ni en el estado; solo el marcador
  `CHANGE_ME`. Los valores reales se ponen con `aws ssm put-parameter`.
- **DynamoDB on-demand**: $0 en reposo; se paga por lectura/escritura.
- **CloudFront PriceClass_100**: solo edges de EE. UU./Europa (más barato).
