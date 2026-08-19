output "bucket_name" {
  value = aws_s3_bucket.videos.id
}

output "bucket_arn" {
  value = aws_s3_bucket.videos.arn
}
