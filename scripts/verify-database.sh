#!/bin/bash

echo "🔍 Verifying database schema..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables if .env file exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Function to run SQL query and check result
run_query() {
    local query="$1"
    local description="$2"
    
    result=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -t -c "$query" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$result" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        return 0
    else
        echo -e "${RED}❌ $description${NC}"
        return 1
    fi
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check database connection
echo -e "${YELLOW}Checking database connection...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
print_status $? "Database connection"

if [ $? -ne 0 ]; then
    echo "Cannot connect to database. Please check your configuration."
    exit 1
fi

echo -e "\n${YELLOW}Verifying tables...${NC}"

# Check if tables exist
run_query "SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews';" "Reviews table exists"
run_query "SELECT 1 FROM information_schema.tables WHERE table_name = 'processed_files';" "Processed files table exists"
run_query "SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations';" "Migrations table exists"

echo -e "\n${YELLOW}Verifying table structure...${NC}"

# Check reviews table columns
run_query "SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'hotelId';" "Reviews.hotelId column"
run_query "SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'platform';" "Reviews.platform column"
run_query "SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'rating';" "Reviews.rating column"
run_query "SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reviewComments';" "Reviews.reviewComments column"
run_query "SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'overallByProviders';" "Reviews.overallByProviders column"

# Check processed_files table columns
run_query "SELECT 1 FROM information_schema.columns WHERE table_name = 'processed_files' AND column_name = 'fileName';" "ProcessedFiles.fileName column"
run_query "SELECT 1 FROM information_schema.columns WHERE table_name = 'processed_files' AND column_name = 'processedAt';" "ProcessedFiles.processedAt column"

echo -e "\n${YELLOW}Verifying indexes...${NC}"

# Check indexes
run_query "SELECT 1 FROM pg_indexes WHERE tablename = 'reviews' AND indexname = 'IDX_REVIEWS_HOTEL_PLATFORM';" "Hotel-Platform index"
run_query "SELECT 1 FROM pg_indexes WHERE tablename = 'reviews' AND indexname = 'IDX_REVIEWS_DATE';" "Review date index"
run_query "SELECT 1 FROM pg_indexes WHERE tablename = 'reviews' AND indexname = 'IDX_REVIEWS_PROVIDER';" "Provider index"
run_query "SELECT 1 FROM pg_indexes WHERE tablename = 'processed_files' AND indexname = 'IDX_PROCESSED_FILES_NAME';" "Processed files name index"

echo -e "\n${YELLOW}Checking constraints...${NC}"

# Check unique constraints
run_query "SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'processed_files' AND constraint_type = 'UNIQUE';" "ProcessedFiles unique constraint"

echo -e "\n${YELLOW}Verifying triggers...${NC}"

# Check triggers
run_query "SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_reviews_updated_at';" "UpdatedAt trigger"

echo -e "\n${YELLOW}Database Statistics:${NC}"

# Get table statistics
echo "Table sizes:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
" 2>/dev/null

echo -e "\nRecord counts:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "
SELECT 'reviews' as table_name, COUNT(*) as count FROM reviews
UNION ALL
SELECT 'processed_files' as table_name, COUNT(*) as count FROM processed_files
UNION ALL
SELECT 'migrations' as table_name, COUNT(*) as count FROM migrations;
" 2>/dev/null

echo -e "\n${GREEN}🎉 Database verification complete!${NC}"
echo ""
echo "Your database is ready for:"
echo "1. Review ingestion: npm run cli:ingest"
echo "2. API operations: npm run start:dev"
echo "3. Data queries: Connect with psql or database client"