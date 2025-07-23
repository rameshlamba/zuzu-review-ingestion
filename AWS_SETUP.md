# AWS S3 Setup Guide

This guide will help you set up AWS S3 for the Review System Microservice.

## Prerequisites

- AWS Account
- AWS CLI installed
- Basic understanding of AWS IAM

## Step 1: Install AWS CLI

### macOS
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

### Linux
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Windows
Download and run the AWS CLI MSI installer from:
https://awscli.amazonaws.com/AWSCLIV2.msi

## Step 2: Create IAM User and Access Keys

1. **Login to AWS Console** → Go to IAM service

2. **Create a new user:**
   - Click "Users" → "Add users"
   - Username: `review-system-service`
   - Access type: ✅ Programmatic access

3. **Attach permissions:**
   - Click "Attach existing policies directly"
   - Search and select: `AmazonS3FullAccess`
   - Or create a custom policy (see below for minimal permissions)

4. **Save the credentials:**
   - Copy the **Access Key ID**
   - Copy the **Secret Access Key**
   - ⚠️ **Important**: Save these securely, you won't see them again!

### Minimal IAM Policy (Recommended)

Instead of `AmazonS3FullAccess`, create a custom policy with minimal permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::zuzu-reviews",
                "arn:aws:s3:::zuzu-reviews/*"
            ]
        }
    ]
}
```

## Step 3: Create S3 Bucket

### Option A: Using AWS Console
1. Go to S3 service in AWS Console
2. Click "Create bucket"
3. Bucket name: `your-company-reviews-bucket` (must be globally unique)
4. Region: Choose your preferred region (e.g., `us-east-1`)
5. Keep default settings and create

### Option B: Using AWS CLI
```bash
# Configure AWS CLI first
aws configure
# Enter your Access Key ID, Secret Access Key, region, and output format

# Create bucket (if it doesn't exist)
aws s3 mb s3://zuzu-reviews --region eu-north-1
```

## Step 4: Configure Environment Variables

Update your `.env` file with the AWS credentials:

```env
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=AKIA...your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET=zuzu-reviews
S3_PREFIX=
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=reviews
NODE_ENV=development
INGESTION_CONCURRENCY=3
```

## Step 5: Test Your Setup

```bash
# Test the configuration
./scripts/test-local-setup.sh

# Upload sample data
./scripts/upload-sample-data.sh

# Verify files were uploaded
aws s3 ls s3://zuzu-reviews/
```

## Step 6: Upload Your Review Files

### File Format
Your `.jl` (JSON Lines) files should contain one JSON object per line:

```json
{"hotelId": 10984, "platform": "Agoda", "hotelName": "Oscar Saigon Hotel", "comment": {...}}
{"hotelId": 12345, "platform": "Booking.com", "hotelName": "Grand Plaza Hotel", "comment": {...}}
```

### Upload Files
```bash
# Upload a single file directly to bucket root
aws s3 cp agoda_com_2025-04-10.jl s3://zuzu-reviews/

# Upload multiple files
aws s3 sync ./review-files/ s3://zuzu-reviews/

# Upload with proper naming convention (platform_date.jl)
aws s3 cp agoda-reviews.jl s3://zuzu-reviews/agoda_com_$(date +%Y-%m-%d).jl
aws s3 cp booking-reviews.jl s3://zuzu-reviews/booking_com_$(date +%Y-%m-%d).jl
aws s3 cp expedia-reviews.jl s3://zuzu-reviews/expedia_com_$(date +%Y-%m-%d).jl
```

## Security Best Practices

### 1. Use IAM Roles (Production)
For production deployments, use IAM roles instead of access keys:
- EC2 instances: Attach IAM role to EC2 instance
- ECS/Fargate: Use task roles
- Lambda: Use execution roles

### 2. Rotate Access Keys Regularly
- Set up key rotation schedule
- Use AWS Secrets Manager for key management

### 3. Enable S3 Bucket Logging
```bash
# Enable access logging
aws s3api put-bucket-logging --bucket your-company-reviews-bucket --bucket-logging-status file://logging.json
```

### 4. Set Up Bucket Policies
Restrict access to your bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "RestrictToReviewService",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/review-system-service"
            },
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-company-reviews-bucket",
                "arn:aws:s3:::your-company-reviews-bucket/*"
            ]
        }
    ]
}
```

## Troubleshooting

### Common Issues

1. **Access Denied Error**
   - Check IAM permissions
   - Verify bucket name is correct
   - Ensure region matches

2. **Bucket Not Found**
   - Verify bucket name spelling
   - Check if bucket exists in the correct region

3. **Invalid Credentials**
   - Verify Access Key ID and Secret Access Key
   - Check if keys are active in IAM console

### Debug Commands

```bash
# Test AWS credentials
aws sts get-caller-identity

# List all buckets
aws s3 ls

# List bucket contents
aws s3 ls s3://your-company-reviews-bucket/reviews/ --recursive

# Check bucket region
aws s3api get-bucket-location --bucket your-company-reviews-bucket
```

## Cost Optimization

### S3 Storage Classes
- Use `Standard-IA` for infrequently accessed files
- Use `Glacier` for long-term archival
- Set up lifecycle policies to automatically transition files

### Example Lifecycle Policy
```json
{
    "Rules": [
        {
            "Id": "ReviewFilesLifecycle",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "reviews/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                }
            ]
        }
    ]
}
```

## Next Steps

1. Set up your AWS credentials
2. Create and configure your S3 bucket
3. Upload sample data using the provided script
4. Test the microservice ingestion
5. Set up monitoring and alerting (CloudWatch)
6. Configure automated daily uploads from your data providers

For production deployment, consider using AWS services like:
- **ECS/Fargate**: For container orchestration
- **RDS**: For managed PostgreSQL
- **CloudWatch**: For monitoring and logging
- **Lambda**: For serverless processing
- **EventBridge**: For scheduled ingestion triggers