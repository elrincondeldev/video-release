variable "name_prefix" {
  type = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "sqs_queue_arn" {
  type = string
}

variable "videos_bucket_arn" {
  type = string
}

variable "ssm_parameter_arns" {
  type = list(string)
}
