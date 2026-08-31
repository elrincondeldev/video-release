locals {
  name_prefix = "${var.prefix}-${var.environment}"
}

module "network" {
  source      = "../../modules/network"
  name_prefix = local.name_prefix
}

module "dynamodb" {
  source      = "../../modules/dynamodb"
  name_prefix = local.name_prefix
}

module "s3_videos" {
  source          = "../../modules/s3_videos"
  name_prefix     = local.name_prefix
  allowed_origins = [module.s3_frontend.cloudfront_url, var.dev_frontend_url]
}

module "s3_frontend" {
  source      = "../../modules/s3_frontend"
  name_prefix = local.name_prefix
}

module "cognito" {
  source        = "../../modules/cognito"
  name_prefix   = local.name_prefix
  domain_prefix = var.cognito_domain_prefix
  callback_urls = ["${module.s3_frontend.cloudfront_url}/callback", "${var.dev_frontend_url}/callback"]
  logout_urls   = [module.s3_frontend.cloudfront_url, var.dev_frontend_url]
}

module "ecr" {
  source      = "../../modules/ecr"
  name_prefix = local.name_prefix
}

module "sqs" {
  source      = "../../modules/sqs"
  name_prefix = local.name_prefix
}

module "ssm" {
  source      = "../../modules/ssm"
  name_prefix = local.name_prefix
}

module "iam" {
  source             = "../../modules/iam"
  name_prefix        = local.name_prefix
  dynamodb_table_arn = module.dynamodb.table_arn
  sqs_queue_arn      = module.sqs.queue_arn
  videos_bucket_arn  = module.s3_videos.bucket_arn
  ssm_parameter_arns = module.ssm.parameter_arns
}

module "api" {
  source          = "../../modules/api"
  name_prefix     = local.name_prefix
  image_uri       = "${module.ecr.repository_urls["api"]}:latest"
  lambda_role_arn = module.iam.lambda_api_role_arn

  environment = {
    DDB_TABLE         = module.dynamodb.table_name
    COGNITO_ISSUER    = module.cognito.issuer
    COGNITO_CLIENT_ID = module.cognito.client_id
    CORS_ORIGINS      = "${module.s3_frontend.cloudfront_url},${var.dev_frontend_url}"
    SQS_QUEUE_URL     = module.sqs.queue_url
  }
}
