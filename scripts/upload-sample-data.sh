#!/bin/bash

echo "Uploading sample review data to AWS S3..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first:"
    echo "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if S3_BUCKET is set
if [ -z "$S3_BUCKET" ]; then
    echo "Please set S3_BUCKET environment variable or update your .env file"
    exit 1
fi

# Create sample data files with proper naming convention
# Agoda sample file
cat > /tmp/agoda_com_$(date +%Y-%m-%d).jl << 'EOF'
{"hotelId": 10984, "platform": "Agoda", "hotelName": "Oscar Saigon Hotel", "comment": {"isShowReviewResponse": false, "hotelReviewId": 948353737, "providerId": 332, "rating": 6.4, "checkInDateMonthAndYear": "April 2025", "encryptedReviewData": "cZwJ6a6ZoFX2W5WwVXaJkA==", "formattedRating": "6.4", "formattedReviewDate": "April 10, 2025", "ratingText": "Good", "responderName": "Oscar Saigon Hotel", "responseDateText": "", "responseTranslateSource": "en", "reviewComments": "Hotel room is basic and very small. not much like pictures. few areas were getting repaired. but since location is so accessible from all main areas in district-1, i would prefer to stay here again. Staff was good.", "reviewNegatives": "", "reviewPositives": "", "reviewProviderLogo": "", "reviewProviderText": "Agoda", "reviewTitle": "Perfect location and safe but hotel under renovation", "translateSource": "en", "translateTarget": "en", "reviewDate": "2025-04-10T05:37:00+07:00", "reviewerInfo": {"countryName": "India", "displayMemberName": "John D.", "flagName": "in", "reviewGroupName": "Solo traveler", "roomTypeName": "Premium Deluxe Double Room", "countryId": 35, "lengthOfStay": 2, "reviewGroupId": 3, "roomTypeId": 0, "reviewerReviewedCount": 0, "isExpertReviewer": false, "isShowGlobalIcon": false, "isShowReviewedCount": false}, "originalTitle": "", "originalComment": "", "formattedResponseDate": ""}, "overallByProviders": [{"providerId": 332, "provider": "Agoda", "overallScore": 7.9, "reviewCount": 7070, "grades": {"Cleanliness": 7.7, "Facilities": 7.2, "Location": 9.1, "Room comfort and quality": 7.5, "Service": 7.8, "Value for money": 7.8}}]}
{"hotelId": 12345, "platform": "Booking.com", "hotelName": "Grand Plaza Hotel", "comment": {"isShowReviewResponse": false, "hotelReviewId": 987654321, "providerId": 456, "rating": 8.5, "checkInDateMonthAndYear": "March 2025", "encryptedReviewData": "xyz123abc456def==", "formattedRating": "8.5", "formattedReviewDate": "March 15, 2025", "ratingText": "Excellent", "responderName": "Grand Plaza Hotel", "responseDateText": "", "responseTranslateSource": "en", "reviewComments": "Amazing hotel with great service and beautiful rooms. The location is perfect for exploring the city. Highly recommended!", "reviewNegatives": "", "reviewPositives": "Great service, beautiful rooms, perfect location", "reviewProviderLogo": "", "reviewProviderText": "Booking.com", "reviewTitle": "Outstanding experience", "translateSource": "en", "translateTarget": "en", "reviewDate": "2025-03-15T10:30:00+07:00", "reviewerInfo": {"countryName": "USA", "displayMemberName": "Sarah M.", "flagName": "us", "reviewGroupName": "Couple", "roomTypeName": "Deluxe Suite", "countryId": 1, "lengthOfStay": 3, "reviewGroupId": 2, "roomTypeId": 1, "reviewerReviewedCount": 5, "isExpertReviewer": true, "isShowGlobalIcon": true, "isShowReviewedCount": true}, "originalTitle": "", "originalComment": "", "formattedResponseDate": ""}, "overallByProviders": [{"providerId": 456, "provider": "Booking.com", "overallScore": 8.2, "reviewCount": 4500, "grades": {"Cleanliness": 8.5, "Facilities": 8.0, "Location": 9.0, "Room comfort and quality": 8.3, "Service": 8.7, "Value for money": 7.8}}]}
{"hotelId": 67890, "platform": "Expedia", "hotelName": "Sunset Resort", "comment": {"isShowReviewResponse": false, "hotelReviewId": 555666777, "providerId": 789, "rating": 7.2, "checkInDateMonthAndYear": "February 2025", "encryptedReviewData": "def789ghi012jkl==", "formattedRating": "7.2", "formattedReviewDate": "February 20, 2025", "ratingText": "Very Good", "responderName": "Sunset Resort", "responseDateText": "", "responseTranslateSource": "en", "reviewComments": "Nice resort with good facilities. The beach access is convenient and the staff is friendly. Room could be a bit larger but overall good value.", "reviewNegatives": "Room size could be better", "reviewPositives": "Good facilities, beach access, friendly staff", "reviewProviderLogo": "", "reviewProviderText": "Expedia", "reviewTitle": "Good value beach resort", "translateSource": "en", "translateTarget": "en", "reviewDate": "2025-02-20T14:15:00+07:00", "reviewerInfo": {"countryName": "Canada", "displayMemberName": "Mike R.", "flagName": "ca", "reviewGroupName": "Family", "roomTypeName": "Standard Room", "countryId": 2, "lengthOfStay": 5, "reviewGroupId": 4, "roomTypeId": 2, "reviewerReviewedCount": 3, "isExpertReviewer": false, "isShowGlobalIcon": false, "isShowReviewedCount": true}, "originalTitle": "", "originalComment": "", "formattedResponseDate": ""}, "overallByProviders": [{"providerId": 789, "provider": "Expedia", "overallScore": 7.5, "reviewCount": 2800, "grades": {"Cleanliness": 7.8, "Facilities": 7.5, "Location": 8.2, "Room comfort and quality": 7.0, "Service": 7.8, "Value for money": 8.0}}]}
{"hotelId": 11111, "platform": "Agoda", "hotelName": "City Center Inn", "comment": {"isShowReviewResponse": false, "hotelReviewId": 111222333, "providerId": 332, "rating": 5.8, "checkInDateMonthAndYear": "January 2025", "encryptedReviewData": "abc123def456ghi==", "formattedRating": "5.8", "formattedReviewDate": "January 5, 2025", "ratingText": "Fair", "responderName": "City Center Inn", "responseDateText": "", "responseTranslateSource": "en", "reviewComments": "The hotel is okay for the price. Location is good but the room was a bit outdated. Service was average.", "reviewNegatives": "Outdated room, average service", "reviewPositives": "Good location, reasonable price", "reviewProviderLogo": "", "reviewProviderText": "Agoda", "reviewTitle": "Decent stay for the price", "translateSource": "en", "translateTarget": "en", "reviewDate": "2025-01-05T16:45:00+07:00", "reviewerInfo": {"countryName": "Australia", "displayMemberName": "Emma T.", "flagName": "au", "reviewGroupName": "Business traveler", "roomTypeName": "Standard Room", "countryId": 3, "lengthOfStay": 1, "reviewGroupId": 1, "roomTypeId": 2, "reviewerReviewedCount": 8, "isExpertReviewer": false, "isShowGlobalIcon": false, "isShowReviewedCount": true}, "originalTitle": "", "originalComment": "", "formattedResponseDate": ""}, "overallByProviders": [{"providerId": 332, "provider": "Agoda", "overallScore": 6.5, "reviewCount": 1200, "grades": {"Cleanliness": 6.0, "Facilities": 6.2, "Location": 8.5, "Room comfort and quality": 5.8, "Service": 6.0, "Value for money": 7.5}}]}
EOF

# Create Booking.com sample file
cat > /tmp/booking_com_$(date +%Y-%m-%d).jl << 'EOF'
{"hotelId": 12345, "platform": "Booking.com", "hotelName": "Grand Plaza Hotel", "comment": {"isShowReviewResponse": false, "hotelReviewId": 987654321, "providerId": 456, "rating": 8.5, "checkInDateMonthAndYear": "March 2025", "encryptedReviewData": "xyz123abc456def==", "formattedRating": "8.5", "formattedReviewDate": "March 15, 2025", "ratingText": "Excellent", "responderName": "Grand Plaza Hotel", "responseDateText": "", "responseTranslateSource": "en", "reviewComments": "Amazing hotel with great service and beautiful rooms. The location is perfect for exploring the city. Highly recommended!", "reviewNegatives": "", "reviewPositives": "Great service, beautiful rooms, perfect location", "reviewProviderLogo": "", "reviewProviderText": "Booking.com", "reviewTitle": "Outstanding experience", "translateSource": "en", "translateTarget": "en", "reviewDate": "2025-03-15T10:30:00+07:00", "reviewerInfo": {"countryName": "USA", "displayMemberName": "Sarah M.", "flagName": "us", "reviewGroupName": "Couple", "roomTypeName": "Deluxe Suite", "countryId": 1, "lengthOfStay": 3, "reviewGroupId": 2, "roomTypeId": 1, "reviewerReviewedCount": 5, "isExpertReviewer": true, "isShowGlobalIcon": true, "isShowReviewedCount": true}, "originalTitle": "", "originalComment": "", "formattedResponseDate": ""}, "overallByProviders": [{"providerId": 456, "provider": "Booking.com", "overallScore": 8.2, "reviewCount": 4500, "grades": {"Cleanliness": 8.5, "Facilities": 8.0, "Location": 9.0, "Room comfort and quality": 8.3, "Service": 8.7, "Value for money": 7.8}}]}
{"hotelId": 54321, "platform": "Booking.com", "hotelName": "Riverside Inn", "comment": {"isShowReviewResponse": false, "hotelReviewId": 123456789, "providerId": 456, "rating": 7.8, "checkInDateMonthAndYear": "April 2025", "encryptedReviewData": "abc789def123ghi==", "formattedRating": "7.8", "formattedReviewDate": "April 5, 2025", "ratingText": "Good", "responderName": "Riverside Inn", "responseDateText": "", "responseTranslateSource": "en", "reviewComments": "Nice hotel by the river. Clean rooms and good breakfast. Staff was helpful and friendly.", "reviewNegatives": "", "reviewPositives": "Clean rooms, good breakfast, helpful staff", "reviewProviderLogo": "", "reviewProviderText": "Booking.com", "reviewTitle": "Pleasant riverside stay", "translateSource": "en", "translateTarget": "en", "reviewDate": "2025-04-05T09:15:00+07:00", "reviewerInfo": {"countryName": "Germany", "displayMemberName": "Hans M.", "flagName": "de", "reviewGroupName": "Solo traveler", "roomTypeName": "Standard Room", "countryId": 4, "lengthOfStay": 2, "reviewGroupId": 3, "roomTypeId": 2, "reviewerReviewedCount": 12, "isExpertReviewer": false, "isShowGlobalIcon": true, "isShowReviewedCount": true}, "originalTitle": "", "originalComment": "", "formattedResponseDate": ""}, "overallByProviders": [{"providerId": 456, "provider": "Booking.com", "overallScore": 7.9, "reviewCount": 3200, "grades": {"Cleanliness": 8.1, "Facilities": 7.5, "Location": 8.5, "Room comfort and quality": 7.8, "Service": 8.2, "Value for money": 7.6}}]}
EOF

# Create Expedia sample file
cat > /tmp/expedia_com_$(date +%Y-%m-%d).jl << 'EOF'
{"hotelId": 67890, "platform": "Expedia", "hotelName": "Sunset Resort", "comment": {"isShowReviewResponse": false, "hotelReviewId": 555666777, "providerId": 789, "rating": 7.2, "checkInDateMonthAndYear": "February 2025", "encryptedReviewData": "def789ghi012jkl==", "formattedRating": "7.2", "formattedReviewDate": "February 20, 2025", "ratingText": "Very Good", "responderName": "Sunset Resort", "responseDateText": "", "responseTranslateSource": "en", "reviewComments": "Nice resort with good facilities. The beach access is convenient and the staff is friendly. Room could be a bit larger but overall good value.", "reviewNegatives": "Room size could be better", "reviewPositives": "Good facilities, beach access, friendly staff", "reviewProviderLogo": "", "reviewProviderText": "Expedia", "reviewTitle": "Good value beach resort", "translateSource": "en", "translateTarget": "en", "reviewDate": "2025-02-20T14:15:00+07:00", "reviewerInfo": {"countryName": "Canada", "displayMemberName": "Mike R.", "flagName": "ca", "reviewGroupName": "Family", "roomTypeName": "Standard Room", "countryId": 2, "lengthOfStay": 5, "reviewGroupId": 4, "roomTypeId": 2, "reviewerReviewedCount": 3, "isExpertReviewer": false, "isShowGlobalIcon": false, "isShowReviewedCount": true}, "originalTitle": "", "originalComment": "", "formattedResponseDate": ""}, "overallByProviders": [{"providerId": 789, "provider": "Expedia", "overallScore": 7.5, "reviewCount": 2800, "grades": {"Cleanliness": 7.8, "Facilities": 7.5, "Location": 8.2, "Room comfort and quality": 7.0, "Service": 7.8, "Value for money": 8.0}}]}
EOF

# Load environment variables if .env file exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Use environment variable or prompt for bucket name
if [ -z "$S3_BUCKET" ]; then
    read -p "Enter your S3 bucket name: " S3_BUCKET
fi

# Upload files with proper naming convention
DATE=$(date +%Y-%m-%d)
FILES=(
    "agoda_com_$DATE.jl"
    "booking_com_$DATE.jl"
    "expedia_com_$DATE.jl"
)

echo "Uploading sample files to s3://$S3_BUCKET/"

for file in "${FILES[@]}"; do
    echo "📤 Uploading $file..."
    aws s3 cp /tmp/$file s3://$S3_BUCKET/$file
    
    if [ $? -eq 0 ]; then
        echo "✅ $file uploaded successfully!"
    else
        echo "❌ Failed to upload $file"
    fi
done

echo ""
echo "📁 Files uploaded to s3://$S3_BUCKET/:"
aws s3 ls s3://$S3_BUCKET/ --recursive | grep "\.jl$"

echo ""
echo "🚀 You can now trigger ingestion:"
echo "curl -X POST http://localhost:3000/ingestion/trigger"

# Clean up temporary files
rm -f /tmp/agoda_com_*.jl /tmp/booking_com_*.jl /tmp/expedia_com_*.jl