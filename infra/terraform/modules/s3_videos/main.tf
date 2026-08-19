resource "aws_s3_bucket" "videos" {
  bucket = "${var.name_prefix}-videos"
}

resource "aws_s3_bucket_public_access_block" "videos" {
  bucket                  = aws_s3_bucket.videos.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id
  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = var.allowed_origins
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "videos" {
  count  = var.retention_days > 0 ? 1 : 0
  bucket = aws_s3_bucket.videos.id
  rule {
    id     = "expire-old-videos"
    status = "Enabled"
    filter {}
    expiration {
      days = var.retention_days
    }
  }
}
