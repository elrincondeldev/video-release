data "aws_iam_policy_document" "lambda_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ecs_tasks_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# --- API + webhook Lambda role ---
resource "aws_iam_role" "lambda_api" {
  name               = "${var.name_prefix}-lambda-api"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
}

resource "aws_iam_role_policy_attachment" "lambda_api_logs" {
  role       = aws_iam_role.lambda_api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_api" {
  statement {
    sid = "DynamoDB"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
    ]
    resources = [var.dynamodb_table_arn, "${var.dynamodb_table_arn}/index/*"]
  }

  statement {
    sid       = "SQSSend"
    actions   = ["sqs:SendMessage"]
    resources = [var.sqs_queue_arn]
  }

  statement {
    sid       = "SSMRead"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = var.ssm_parameter_arns
  }

  statement {
    sid       = "S3Videos"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${var.videos_bucket_arn}/*"]
  }
}

resource "aws_iam_role_policy" "lambda_api" {
  name   = "${var.name_prefix}-lambda-api"
  role   = aws_iam_role.lambda_api.id
  policy = data.aws_iam_policy_document.lambda_api.json
}

# --- Dispatcher Lambda role (SQS -> ecs:RunTask) ---
resource "aws_iam_role" "dispatcher" {
  name               = "${var.name_prefix}-dispatcher"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
}

resource "aws_iam_role_policy_attachment" "dispatcher_logs" {
  role       = aws_iam_role.dispatcher.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "dispatcher" {
  statement {
    sid       = "SQSConsume"
    actions   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
    resources = [var.sqs_queue_arn]
  }

  # The concrete task definition ARN does not exist yet (created in Phase 3).
  statement {
    sid       = "RunTask"
    actions   = ["ecs:RunTask"]
    resources = ["*"]
  }

  statement {
    sid       = "PassRole"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.worker_task.arn, aws_iam_role.ecs_execution.arn]
  }

  statement {
    sid       = "DDBUpdate"
    actions   = ["dynamodb:UpdateItem"]
    resources = [var.dynamodb_table_arn]
  }
}

resource "aws_iam_role_policy" "dispatcher" {
  name   = "${var.name_prefix}-dispatcher"
  role   = aws_iam_role.dispatcher.id
  policy = data.aws_iam_policy_document.dispatcher.json
}

# --- Worker task role: application permissions at runtime ---
resource "aws_iam_role" "worker_task" {
  name               = "${var.name_prefix}-worker-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
}

data "aws_iam_policy_document" "worker_task" {
  statement {
    sid       = "S3PutVideos"
    actions   = ["s3:PutObject"]
    resources = ["${var.videos_bucket_arn}/*"]
  }

  statement {
    sid       = "DDBUpdate"
    actions   = ["dynamodb:UpdateItem", "dynamodb:GetItem"]
    resources = [var.dynamodb_table_arn]
  }

  statement {
    sid       = "SSMRead"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = var.ssm_parameter_arns
  }
}

resource "aws_iam_role_policy" "worker_task" {
  name   = "${var.name_prefix}-worker-task"
  role   = aws_iam_role.worker_task.id
  policy = data.aws_iam_policy_document.worker_task.json
}

# --- ECS execution role: pulls the ECR image and creates logs ---
resource "aws_iam_role" "ecs_execution" {
  name               = "${var.name_prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
