# Database Setup Guide

This guide covers the database setup and migration system for the Review System Microservice.

## Overview

The microservice uses PostgreSQL with TypeORM for database operations and migrations. The database schema is designed to handle hotel reviews from multiple platforms (Agoda, Booking.com, Expedia) with proper indexing for performance.

## Database Schema

### Tables

#### 1. `reviews` Table
Main table storing all review data with the following key columns:

**Basic Review Info:**
- `id` (Primary Key)
- `hotelId` - Hotel identifier
- `platform` - Review platform (Agoda, Booking.com, Expedia)
- `hotelName` - Hotel name
- `hotelReviewId` - Platform-specific review ID
- `providerId` - Provider identifier
- `rating` - Review rating (decimal 3,1)
- `reviewDate` - Date of the review

**Review Content:**
- `reviewComments` - Main review text
- `reviewTitle` - Review title
- `reviewNegatives` - Negative aspects
- `reviewPositives` - Positive aspects
- `ratingText` - Rating description (Good, Excellent, etc.)

**Reviewer Information:**
- `reviewerCountryName` - Reviewer's country
- `reviewerDisplayName` - Reviewer's display name
- `reviewerGroupName` - Traveler type (Solo, Couple, Family, Business)
- `roomTypeName` - Room type stayed in
- `lengthOfStay` - Number of nights
- `isExpertReviewer` - Expert reviewer flag

**Metadata:**
- `overallByProviders` - JSON data with overall scores
- `createdAt` - Record creation timestamp
- `updatedAt` - Record update timestamp

#### 2. `processed_files` Table
Tracks processed S3 files to ensure idempotent processing:

- `id` (Primary Key)
- `fileName` - S3 file name (unique)
- `processedAt` - Processing timestamp
- `reviewCount` - Number of reviews processed from file
- `createdAt` - Record creation timestamp

### Indexes

The following indexes are created for optimal query performance:

- `IDX_REVIEWS_HOTEL_PLATFORM` - (hotelId, platform)
- `IDX_REVIEWS_DATE` - (reviewDate)
- `IDX_REVIEWS_PROVIDER` - (providerId)
- `IDX_REVIEWS_RATING` - (rating)
- `IDX_REVIEWS_HOTEL_REVIEW_ID` - (hotelReviewId)
- `IDX_PROCESSED_FILES_NAME` - (fileName)

## Migration System

### TypeORM Migrations

The project uses TypeORM migrations for database schema management:

```bash
# Run all pending migrations
npm run migration:run

# Show migration status
npm run migration:show

# Revert last migration
npm run migration:revert

# Generate new migration (after entity changes)
npm run migration:generate src/database/migrations/NewMigrationName
```

### Migration Files

Migrations are stored in `src/database/migrations/` with timestamp prefixes:

- `1690000000000-CreateReviewTables.ts` - Initial schema creation

### Data Source Configuration

Database connection is configured in `src/database/data-source.ts`:

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'reviews',
  entities: [Review, ProcessedFile],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // Always use migrations
});
```

## Setup Instructions

### 1. Start PostgreSQL

Using Docker Compose:
```bash
docker-compose -f docker-compose.dev.yml up -d postgres
```

Or install PostgreSQL locally and create database:
```sql
CREATE DATABASE reviews;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE reviews TO postgres;
```

### 2. Configure Environment

Ensure your `.env` file has correct database settings:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=reviews
```

### 3. Run Migrations

Using the helper script (recommended):
```bash
./scripts/run-migrations.sh
```

Or manually:
```bash
npm run migration:run
```

### 4. Verify Setup

Check if tables were created:
```sql
-- Connect to database
psql -h localhost -U postgres -d reviews

-- List tables
\dt

-- Check reviews table structure
\d reviews

-- Check processed_files table structure
\d processed_files

-- View indexes
\di
```

## Database Operations

### Common Queries

**Get review statistics by platform:**
```sql
SELECT 
    platform,
    COUNT(*) as review_count,
    AVG(rating) as avg_rating,
    MIN(rating) as min_rating,
    MAX(rating) as max_rating
FROM reviews 
GROUP BY platform;
```

**Get recent reviews:**
```sql
SELECT 
    "hotelName",
    platform,
    rating,
    "reviewTitle",
    "reviewDate"
FROM reviews 
ORDER BY "reviewDate" DESC 
LIMIT 10;
```

**Check processed files:**
```sql
SELECT 
    "fileName",
    "processedAt",
    "reviewCount"
FROM processed_files 
ORDER BY "processedAt" DESC;
```

**Get reviews by hotel:**
```sql
SELECT 
    "hotelName",
    platform,
    rating,
    "reviewComments",
    "reviewDate"
FROM reviews 
WHERE "hotelId" = 10984
ORDER BY "reviewDate" DESC;
```

### Performance Monitoring

**Check index usage:**
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('reviews', 'processed_files');
```

**Table sizes:**
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public';
```

## Backup and Restore

### Backup Database

```bash
# Full database backup
pg_dump -h localhost -U postgres -d reviews > reviews_backup.sql

# Schema only
pg_dump -h localhost -U postgres -d reviews --schema-only > reviews_schema.sql

# Data only
pg_dump -h localhost -U postgres -d reviews --data-only > reviews_data.sql
```

### Restore Database

```bash
# Restore full backup
psql -h localhost -U postgres -d reviews < reviews_backup.sql

# Restore schema only
psql -h localhost -U postgres -d reviews < reviews_schema.sql
```

## Troubleshooting

### Common Issues

**1. Migration fails with "relation already exists"**
```bash
# Check migration status
npm run migration:show

# If needed, manually mark migration as run
# (Connect to database and insert into migrations table)
```

**2. Connection refused**
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.dev.yml ps postgres

# Check connection
pg_isready -h localhost -p 5432 -U postgres
```

**3. Permission denied**
```bash
# Grant permissions
psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE reviews TO postgres;"
```

**4. Out of disk space**
```bash
# Check database size
psql -h localhost -U postgres -d reviews -c "SELECT pg_size_pretty(pg_database_size('reviews'));"

# Clean up old data if needed
DELETE FROM reviews WHERE "reviewDate" < '2024-01-01';
```

### Debug Commands

```bash
# Check database connection
npm run cli:status

# Test database with sample data
npm run cli:ingest

# View application logs
npm run start:dev

# Check migration history
npm run migration:show
```

## Production Considerations

### Performance Tuning

1. **Connection Pooling**: Configure appropriate pool size
2. **Indexes**: Monitor and add indexes based on query patterns
3. **Partitioning**: Consider partitioning by date for large datasets
4. **Archiving**: Archive old reviews to separate tables

### Monitoring

1. **Query Performance**: Monitor slow queries
2. **Index Usage**: Ensure indexes are being used
3. **Table Growth**: Monitor table sizes
4. **Connection Count**: Monitor active connections

### Security

1. **User Permissions**: Use dedicated database user with minimal permissions
2. **SSL**: Enable SSL for database connections in production
3. **Backup Encryption**: Encrypt database backups
4. **Access Control**: Restrict database access to application servers only

## Schema Evolution

When adding new fields or tables:

1. **Create Migration**: Generate new migration file
2. **Update Entities**: Modify TypeORM entities
3. **Test Migration**: Test on development database
4. **Deploy**: Run migration in production
5. **Verify**: Confirm schema changes are applied correctly

Example of adding a new field:
```bash
# After modifying entity
npm run migration:generate src/database/migrations/AddNewField

# Review generated migration
# Run migration
npm run migration:run
```