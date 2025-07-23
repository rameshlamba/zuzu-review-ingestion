#!/bin/bash

echo "🗄️  Running database migrations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables if .env file exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if database connection variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Database environment variables not set${NC}"
    echo "Please ensure DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_NAME are set in your .env file"
    exit 1
fi

echo -e "${YELLOW}Database Configuration:${NC}"
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking database connection...${NC}"
if command -v pg_isready &> /dev/null; then
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is accessible${NC}"
    else
        echo -e "${RED}❌ Cannot connect to database${NC}"
        echo "Make sure PostgreSQL is running and credentials are correct"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  pg_isready not found, skipping connection check${NC}"
fi

# Show pending migrations
echo -e "\n${YELLOW}Checking migration status...${NC}"
npm run migration:show

# Run migrations
echo -e "\n${YELLOW}Running migrations...${NC}"
npm run migration:run

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Migrations completed successfully!${NC}"
    echo ""
    echo "Your database is now ready. You can:"
    echo "1. Start the application: npm run start:dev"
    echo "2. Run ingestion: npm run cli:ingest"
    echo "3. Check status: npm run cli:status"
else
    echo -e "\n${RED}❌ Migration failed${NC}"
    echo "Please check the error messages above and fix any issues"
    exit 1
fi