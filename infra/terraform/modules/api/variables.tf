variable "name_prefix" {
  type = string
}

variable "image_uri" {
  type = string
}

variable "lambda_role_arn" {
  type = string
}

variable "environment" {
  type    = map(string)
  default = {}
}

variable "log_retention_days" {
  type    = number
  default = 14
}
