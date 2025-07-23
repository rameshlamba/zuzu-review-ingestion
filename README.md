# Review System Microservice

A robust and scalable microservice that retrieves hotel reviews from AWS S3, processes the data, and stores it in a PostgreSQL database. Built with NestJS and TypeScript with comprehensive testing and CI/CD pipeline.

## Features

- **Automated S3 Ingestion**: Periodically pulls review files from AWS S3 bucket
- **Data Validation**: Validates and transforms JSON Lines (.jl) review data
- **Idempotent Processing**: Only processes new files, avoiding duplicates
- **Concurrent Processing**: Configurable concurrency for better performance
- **Robust Error Handling**: Comprehensive error handling and logging
- **REST API**: Complete API for reviews with filtering, pagination, and statistics
- **CLI Tools**: Command-line interface for manual operations
- **Scheduled Jobs**: Daily automated ingestion via cron jobs
- **Docker Support**: Fully containerized with Docker Compose
- **Database Schema**: Optimized PostgreSQL schema with proper indexing
- **Comprehensive Testing**: 108 tests with 83%+ coverage
- **CI/CD Pipeline**: GitHub Actions with automated testing, security scanning, and deployment

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
npm run test:e2e          # End-to-end tests
npm run test:watch        # Watch mode for development
./scripts/test-local-setup.sh  # Test AWS setup
```

### Docker
```bash
docker-compose up -d      # Start all services (production)
docker-compose -f docker-compose.dev.yml up -d postgres  # Start only PostgreSQL
```

## API Endpoints

### Ingestion Endpoints

#### Trigger Manual Ingestion
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

#### Get Ingestion Status
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

### Reviews API Endpoints

#### Get Reviews with Filtering
```bash
GET /reviews?page=1&limit=20&platform=Agoda&minRating=7&sortBy=rating&sortOrder=DESC
```

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `hotelId` (number): Filter by hotel ID
- `platform` (string): Filter by platform
- `minRating`/`maxRating` (number): Rating range filter
- `startDate`/`endDate` (string): Date range filter (YYYY-MM-DD)
- `search` (string): Search in comments and hotel names
- `sortBy` (string): Sort field (reviewDate, rating, hotelName, platform)
- `sortOrder` (string): ASC or DESC

#### Get Review by ID
```bash
GET /reviews/:id
```

#### Get Hotel Reviews
```bash
GET /reviews/hotels/:hotelId
```

#### Get Review Statistics
```bash
GET /reviews/stats
```

#### Get Available Platforms
```bash
GET /reviews/platforms
```

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

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

## Scripts & Utilities

The project includes several utility scripts for setup and maintenance:

### Setup Scripts
```bash
./scripts/test-local-setup.sh    # Test AWS and database configuration
./scripts/upload-sample-data.sh  # Upload sample review data to S3
./scripts/run-migrations.sh      # Run database migrations with checks
./scripts/verify-database.sh     # Verify database schema and data
```

### Code Quality
```bash
npm run lint                     # Run ESLint
npm run lint:check              # Check linting without fixing
npm run format                  # Format code with Prettier
npm run format:check            # Check formatting without fixing
```

## Project Structure

```
├── src/
│   ├── app.module.ts           # Main application module
│   ├── main.ts                 # Application entry point
│   ├── cli.ts                  # CLI interface
│   ├── config/                 # Configuration management
│   ├── database/               # Database entities and migrations
│   ├── ingestion/              # S3 ingestion logic
│   ├── reviews/                # Reviews API and business logic
│   ├── s3/                     # AWS S3 service
│   └── utils/                  # Shared utilities
├── test/                       # E2E tests
├── scripts/                    # Utility scripts
├── .github/workflows/          # CI/CD pipelines
└── docs/                       # Additional documentation
```

## Documentation

- [API Documentation](API_DOCUMENTATION.md) - Complete REST API reference
- [Architecture Guide](ARCHITECTURE.md) - System architecture and design patterns
- [AWS Setup Guide](AWS_SETUP.md) - AWS S3 configuration and setup
- [Database Setup](DATABASE_SETUP.md) - Database schema and migration guide
- [CI/CD Setup](CI_CD_SETUP.md) - GitHub Actions pipeline configuration

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18+
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Cloud**: AWS S3
- **Containerization**: Docker & Docker Compose

### Development Tools
- **Testing**: Jest (Unit & E2E tests)
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **CI/CD**: GitHub Actions

### Production Features
- **Logging**: Structured JSON logging
- **Monitoring**: Health checks and metrics
- **Security**: Input validation, SQL injection prevention
- **Performance**: Connection pooling, concurrent processing
- **Reliability**: Idempotent operations, error handling

## Performance Metrics

Based on testing with sample data:
- **Ingestion Speed**: ~1000 reviews/second
- **API Response Time**: <100ms for filtered queries
- **Memory Usage**: ~150MB base, scales with concurrent processing
- **Database Performance**: Optimized with proper indexing

## Security Features

- **Input Validation**: Global validation pipes with class-validator
- **SQL Injection Prevention**: TypeORM parameterized queries
- **Environment Security**: Sensitive data in environment variables
- **AWS Security**: IAM roles and least privilege access
- **Container Security**: Non-root user, minimal base image

## Monitoring & Observability

### Logging
- Structured JSON logs with context
- Different log levels (INFO, WARN, ERROR, DEBUG)
- Request/response logging
- Performance metrics logging

### Health Checks
- Database connectivity check
- S3 access verification
- Application status endpoint
- Docker health check integration

### Metrics
- Processing statistics (files processed, reviews ingested)
- Error rates and types
- Performance benchmarks
- Resource utilization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Run linting and formatting (`npm run lint && npm run format`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure CI/CD pipeline passes

## License

MIT License - see LICENSE file for details

---

## Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Check existing documentation
- Review the troubleshooting section
- Run the test setup script for configuration issues

**Happy coding! 🚀**