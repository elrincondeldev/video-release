output "role_arns" {
  value = {
    lambda_api    = aws_iam_role.lambda_api.arn
    dispatcher    = aws_iam_role.dispatcher.arn
    worker_task   = aws_iam_role.worker_task.arn
    ecs_execution = aws_iam_role.ecs_execution.arn
  }
}

output "lambda_api_role_arn" {
  value = aws_iam_role.lambda_api.arn
}

output "dispatcher_role_arn" {
  value = aws_iam_role.dispatcher.arn
}

output "worker_task_role_arn" {
  value = aws_iam_role.worker_task.arn
}

output "ecs_execution_role_arn" {
  value = aws_iam_role.ecs_execution.arn
}
