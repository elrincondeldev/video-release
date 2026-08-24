output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_client_id" {
  value = module.cognito.client_id
}

output "cognito_hosted_ui_domain" {
  value = module.cognito.hosted_ui_domain
}

output "cognito_issuer" {
  value = module.cognito.issuer
}

output "dynamodb_table_name" {
  value = module.dynamodb.table_name
}

output "videos_bucket" {
  value = module.s3_videos.bucket_name
}

output "frontend_bucket" {
  value = module.s3_frontend.bucket_name
}

output "cloudfront_distribution_id" {
  value = module.s3_frontend.cloudfront_distribution_id
}

output "frontend_url" {
  value = module.s3_frontend.cloudfront_url
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "sqs_queue_url" {
  value = module.sqs.queue_url
}

output "ssm_parameter_names" {
  value = module.ssm.parameter_names
}

output "iam_role_arns" {
  value = module.iam.role_arns
}

output "api_url" {
  value = module.api.api_url
}
