# Review System Microservice

A robust and scalable microservice that retrieves hotel reviews from AWS S3, processes the data, and stores it in a PostgreSQL database. Built with NestJS and TypeScript.

## Features

- **Automated S3 Ingestion**: Periodically pulls review files from AWS S3 bucket
- **Data Validation**: Validates and transforms JSON Lines (.jl) review data
- **Idempotent Processing**: Only processes new files, avoiding duplicates
- **Concurrent Processing**: Configurable concurrency for better performance
- **Robust Error Handling**: Comprehensive error handling and logging
- **REST API**: Manual trigger and monitoring endpoints
- **Scheduled Jobs**: Daily automated ingestion via cron jobs
- **Docker Support**: Fully containerized with Docker Compose
- **Database Schema**: Optimized PostgreSQL schema with proper indexing

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS S3        │    │   Microservice  │    │   PostgreSQL    │
│   (.jl files)   │───▶│   (NestJS)      │───▶│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   REST API      │
                       │   /ingestion/*  │
                       └─────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- AWS Account with S3 access
- AWS Access Key ID and Secret Access Key
- Node.js 18+ (for local development)

### 1. Environment Setup

Copy the example environment file and configure your AWS credentials:

```bash
cp .env.example .env
```

Edit `.env` with your AWS credentials and S3 bucket information:

```env
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_BUCKET=zuzu-reviews
S3_PREFIX=
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=reviews
```

### 2. AWS S3 Setup

Your S3 bucket `zuzu-reviews` should contain .jl files directly in the root:

```bash
# Upload sample .jl files directly to bucket root
aws s3 cp agoda_com_2025-04-10.jl s3://zuzu-reviews/
aws s3 cp booking_com_2025-04-10.jl s3://zuzu-reviews/
aws s3 cp expedia_com_2025-04-10.jl s3://zuzu-reviews/

# List files to verify
aws s3 ls s3://zuzu-reviews/

# Or use the provided script to upload sample data
./scripts/upload-sample-data.sh
```

### 3. Database Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be ready, then run migrations
./scripts/run-migrations.sh

# Or run migrations manually
npm run migration:run
```

### 4. Local Development

```bash
# Run the application in development mode
npm run start:dev
```

### 5. Test the Setup

```bash
# Trigger manual ingestion
curl -X POST http://localhost:3000/ingestion/trigger

# Check ingestion status
curl http://localhost:3000/ingestion/status

# Use CLI tools
npm run cli ingest
npm run cli status
npm run cli stats
```

### 6. Production Deployment

```bash
# Start all services including the app
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Available Commands

### Database Migrations
```bash
npm run migration:run      # Run pending migrations
npm run migration:show     # Show migration status
npm run migration:revert   # Revert last migration
npm run migration:generate # Generate new migration
./scripts/run-migrations.sh # Run migrations with checks
```

### Development
```bash
npm run start:dev          # Start in development mode
npm run build             # Build for production
npm run start:prod        # Start production build
```

### CLI Tools
```bash
npm run cli:ingest        # Manual ingestion
npm run cli:status        # Check ingestion status
npm run cli:stats         # View review statistics
```

### Testing
```bash
npm test                  # Run unit tests
npm run test:cov          # Test with coverage
./scripts/test-local-setup.sh  # Test AWS setup
```

### Docker
```bash
docker-compose up -d      # Start all services (production)
docker-compose -f docker-compose.dev.yml up -d postgres  # Start only PostgreSQL
```

## API Endpoints

### Trigger Manual Ingestion
```bash
POST /ingestion/trigger
```

Response:
```json
{
  "success": true,
  "message": "Ingestion completed successfully",
  "result": {
    "processed": 5,
    "skipped": 2,
    "errors": 0
  }
}
```

### Get Ingestion Status
```bash
GET /ingestion/status
```

Response:
```json
{
  "success": true,
  "isRunning": false,
  "stats": {
    "totalReviews": 15420,
    "totalFiles": 7,
    "platformStats": [
      {
        "platform": "Agoda",
        "count": "8500",
        "avgRating": "7.2"
      }
    ]
  }
}
```

## Data Schema

### Review Entity

The service processes JSON Lines files with the following structure:

```json
{
  "hotelId": 10984,
  "platform": "Agoda",
  "hotelName": "Oscar Saigon Hotel",
  "comment": {
    "hotelReviewId": 948353737,
    "providerId": 332,
    "rating": 6.4,
    "reviewComments": "Hotel room is basic...",
    "reviewDate": "2025-04-10T05:37:00+07:00",
    "reviewerInfo": {
      "countryName": "India",
      "displayMemberName": "********",
      "lengthOfStay": 2
    }
  },
  "overallByProviders": [...]
}
```

### Database Tables

- **reviews**: Main review data with proper indexing
- **processed_files**: Tracks processed files for idempotent operation

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for S3 | `us-east-1` |
| `S3_BUCKET` | S3 bucket name | Required |
| `S3_PREFIX` | S3 prefix/folder path | `reviews/` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | Required |
| `DB_NAME` | Database name | `reviews` |
| `INGESTION_CONCURRENCY` | Concurrent file processing | `3` |
| `NODE_ENV` | Environment mode | `development` |

### Scheduled Jobs

- **Daily Ingestion**: Runs at 2 AM daily
- **Custom Schedule**: Uncomment lines in `cron.task.ts` for different frequencies

## Monitoring & Logging

### Logs

All operations are logged with timestamps and context:

```
[2025-01-22T10:30:00.000Z] [INFO] Starting ingestion process... | Context: {"bucket":"my-bucket","prefix":"reviews/"}
[2025-01-22T10:30:01.000Z] [INFO] Found 3 JSONL files in S3
[2025-01-22T10:30:02.000Z] [INFO] Processing file: reviews/2025-01-22.jl
```

### Health Check

Docker health check endpoint: `GET /ingestion/status`

### Error Handling

- AWS S3 connection failures with retry logic
- Malformed JSON data validation and skipping
- Database connection and transaction handling
- Comprehensive error logging

## Testing

```bash
# Unit tests
npm test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## Production Deployment

### AWS ECS/Fargate

1. Build and push Docker image to ECR
2. Create ECS task definition
3. Configure environment variables
4. Set up CloudWatch logging
5. Configure auto-scaling

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: review-microservice
spec:
  replicas: 2
  selector:
    matchLabels:
      app: review-microservice
  template:
    metadata:
      labels:
        app: review-microservice
    spec:
      containers:
      - name: app
        image: your-registry/review-microservice:latest
        ports:
        - containerPort: 3000
        env:
        - name: AWS_REGION
          value: "us-east-1"
        # ... other env vars
```

## Scaling Considerations

### Performance Optimization

- **Concurrent Processing**: Adjust `INGESTION_CONCURRENCY` based on resources
- **Database Indexing**: Optimized indexes on frequently queried fields
- **Connection Pooling**: TypeORM connection pooling for database efficiency
- **Memory Management**: Streaming JSON parsing to handle large files

### Horizontal Scaling

- Multiple service instances can run concurrently
- Database-level locking prevents duplicate processing
- Stateless design enables easy scaling

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure proper IAM permissions for S3 access
2. **Database Connection**: Check PostgreSQL connectivity and credentials
3. **File Processing**: Verify S3 bucket and prefix configuration
4. **Memory Issues**: Adjust Docker memory limits for large files

### Debug Mode

```bash
NODE_ENV=development npm run start:dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details