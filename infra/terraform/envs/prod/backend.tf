# Replace REPLACE_ACCOUNT_ID with the value printed by the bootstrap's
# `terraform output` (or paste the `backend_config` block from that output).
terraform {
  backend "s3" {
    bucket         = "rdr-tfstate-447393541483"
    key            = "prod/terraform.tfstate"
    region         = "eu-south-2"
    dynamodb_table = "rdr-tfstate-lock"
    encrypt        = true
  }
}
