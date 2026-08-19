variable "prefix" {
  type    = string
  default = "rdr"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "region" {
  type    = string
  default = "eu-south-2"
}

# Prefix for the Cognito Hosted UI domain. Must be globally unique within the
# region; change it if it is already taken.
variable "cognito_domain_prefix" {
  type    = string
  default = "rdr-prod-auth"
}

# Local dev frontend URL (Vite). Used for Cognito callbacks and CORS.
variable "dev_frontend_url" {
  type    = string
  default = "http://localhost:5173"
}
