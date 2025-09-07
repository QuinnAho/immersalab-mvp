output "s3_bucket_name" {
  description = "Name of the S3 bucket for assets"
  value       = aws_s3_bucket.assets.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for assets"
  value       = aws_s3_bucket.assets.arn
}

output "sqs_queue_url" {
  description = "URL of the SQS queue for render jobs"
  value       = aws_sqs_queue.render_jobs.url
}

output "sqs_queue_arn" {
  description = "ARN of the SQS queue for render jobs"
  value       = aws_sqs_queue.render_jobs.arn
}

output "api_role_arn" {
  description = "ARN of the API service IAM role"
  value       = aws_iam_role.api_role.arn
}

output "worker_role_arn" {
  description = "ARN of the Worker service IAM role"
  value       = aws_iam_role.worker_role.arn
}