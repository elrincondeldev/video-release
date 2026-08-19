variable "name_prefix" {
  type = string
}

variable "allowed_origins" {
  type    = list(string)
  default = ["*"]
}

# 0 = no expiration. >0 = delete videos after N days (cheaper storage).
variable "retention_days" {
  type    = number
  default = 0
}
