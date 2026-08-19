variable "name_prefix" {
  type = string
}

# Point-in-time recovery: continuous backups. Priced per GB, so off in v1.
variable "enable_pitr" {
  type    = bool
  default = false
}
