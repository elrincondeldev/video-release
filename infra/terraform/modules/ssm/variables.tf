variable "name_prefix" {
  type = string
}

variable "parameter_names" {
  type    = list(string)
  default = ["github_app_private_key", "github_webhook_secret", "replicate_api_token"]
}
