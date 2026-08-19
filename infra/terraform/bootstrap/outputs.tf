output "state_bucket" {
  value = aws_s3_bucket.state.id
}

output "lock_table" {
  value = aws_dynamodb_table.lock.name
}

# Ready-to-copy block for envs/prod/backend.tf
output "backend_config" {
  value = <<-EOT
    terraform {
      backend "s3" {
        bucket         = "${local.state_bucket}"
        key            = "prod/terraform.tfstate"
        region         = "${var.region}"
        dynamodb_table = "${local.lock_table}"
        encrypt        = true
      }
    }
  EOT
}
