# Create the parameters with a placeholder value and ignore changes to `value`:
# the real secret NEVER lives in the code or in Terraform state. The real value
# is set later, out of band (console or `aws ssm put-parameter`).
resource "aws_ssm_parameter" "secret" {
  for_each = toset(var.parameter_names)

  name  = "/${var.name_prefix}/${each.value}"
  type  = "SecureString"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }
}
