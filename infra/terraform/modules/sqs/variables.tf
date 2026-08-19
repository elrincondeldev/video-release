variable "name_prefix" {
  type = string
}

# How long a message stays hidden after being received. Covers the dispatcher
# startup + RunTask, not the full recording.
variable "visibility_timeout_seconds" {
  type    = number
  default = 300
}

variable "max_receive_count" {
  type    = number
  default = 3
}
