#!/bin/bash

echo "🧪 Testing AWS S3 Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Load environment variables if .env file exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check prerequisites
echo "Checking prerequisites..."

command_exists docker
print_status $? "Docker installed"

command_exists docker-compose
print_status $? "Docker Compose installed"

command_exists aws
if [ $? -eq 0 ]; then
    print_status 0 "AWS CLI installed"
else
    print_status 1 "AWS CLI not installed (install from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)"
fi

# Check environment variables
echo -e "\n${YELLOW}Checking environment configuration...${NC}"

if [ -f ".env" ]; then
    print_status 0 ".env file exists"
else
    print_status 1 ".env file missing (copy from .env.example)"
fi

if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    print_status 0 "AWS_ACCESS_KEY_ID is set"
else
    print_status 1 "AWS_ACCESS_KEY_ID not set in .env"
fi

if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    print_status 0 "AWS_SECRET_ACCESS_KEY is set"
else
    print_status 1 "AWS_SECRET_ACCESS_KEY not set in .env"
fi

if [ -n "$S3_BUCKET" ]; then
    print_status 0 "S3_BUCKET is set ($S3_BUCKET)"
else
    print_status 1 "S3_BUCKET not set in .env"
fi

# Test AWS credentials and S3 access
if command_exists aws && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "\n${YELLOW}Testing AWS S3 access...${NC}"
    
    # Test AWS credentials
    aws sts get-caller-identity > /dev/null 2>&1
    print_status $? "AWS credentials are valid"
    
    if [ -n "$S3_BUCKET" ]; then
        # Check if bucket exists and is accessible
        aws s3 ls s3://$S3_BUCKET > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_status 0 "S3 bucket '$S3_BUCKET' is accessible"
            
            # List .jl files in bucket root (no prefix)
            FILE_COUNT=$(aws s3 ls s3://$S3_BUCKET/ 2>/dev/null | grep "\.jl$" | wc -l)
            if [ $FILE_COUNT -gt 0 ]; then
                print_status 0 "Found $FILE_COUNT .jl files in bucket"
                echo "Files:"
                aws s3 ls s3://$S3_BUCKET/ | grep "\.jl$"
            else
                print_status 1 "No .jl files found in bucket"
                echo "Run: ./scripts/upload-sample-data.sh"
            fi
        else
            print_status 1 "Cannot access S3 bucket '$S3_BUCKET'"
            echo "Make sure the bucket exists and you have proper permissions"
        fi
    fi
fi

# Check PostgreSQL
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if docker-compose -f docker-compose.dev.yml ps postgres 2>/dev/null | grep -q "Up"; then
    print_status 0 "PostgreSQL is running"
else
    print_status 1 "PostgreSQL is not running"
    echo "Run: docker-compose -f docker-compose.dev.yml up -d postgres"
fi

# Check if app dependencies are installed
echo -e "\n${YELLOW}Checking Node.js setup...${NC}"
if [ -d "node_modules" ]; then
    print_status 0 "Node modules installed"
else
    print_status 1 "Node modules not installed"
    echo "Run: npm install"
fi

echo -e "\n${GREEN}🎉 Setup test complete!${NC}"
echo -e "\nNext steps:"
echo "1. Configure AWS credentials in .env file"
echo "2. Start PostgreSQL: docker-compose -f docker-compose.dev.yml up -d postgres"
echo "3. Upload sample data: ./scripts/upload-sample-data.sh"
echo "4. Start app: npm run start:dev"
echo "5. Test ingestion: curl -X POST http://localhost:3000/ingestion/trigger"