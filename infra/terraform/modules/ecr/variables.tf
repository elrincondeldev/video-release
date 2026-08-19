variable "name_prefix" {
  type = string
}

variable "repository_names" {
  type    = list(string)
  default = ["api", "worker"]
}
