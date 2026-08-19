output "parameter_names" {
  value = [for p in aws_ssm_parameter.secret : p.name]
}

output "parameter_arns" {
  value = [for p in aws_ssm_parameter.secret : p.arn]
}
