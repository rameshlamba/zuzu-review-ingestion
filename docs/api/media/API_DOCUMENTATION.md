# Review System REST API Documentation

## Overview

The Review System REST API provides comprehensive endpoints to fetch, filter, and analyze stored hotel reviews. All endpoints return JSON responses and support various query parameters for filtering, sorting, and pagination.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication is required for the API endpoints.

## Common Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": {...},
  "error": null
}
```

For paginated responses:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Endpoints

### 1. Get Reviews

Retrieve a paginated list of reviews with optional filtering and sorting.

**Endpoint:** `GET /reviews`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (min: 1) |
| `limit` | number | 20 | Items per page (min: 1, max: 100) |
| `hotelId` | number | - | Filter by hotel ID |
| `platform` | string | - | Filter by platform (partial match) |
| `hotelName` | string | - | Filter by hotel name (partial match) |
| `minRating` | number | - | Minimum rating (0-10) |
| `maxRating` | number | - | Maximum rating (0-10) |
| `startDate` | string | - | Start date (ISO format: YYYY-MM-DD) |
| `endDate` | string | - | End date (ISO format: YYYY-MM-DD) |
| `reviewerCountry` | string | - | Filter by reviewer country |
| `search` | string | - | Search in comments, title, and hotel name |
| `sortBy` | string | reviewDate | Sort field: reviewDate, rating, createdAt, hotelName, platform |
| `sortOrder` | string | DESC | Sort order: ASC or DESC |
| `includeStats` | boolean | false | Include statistics in response |

**Example Request:**

```bash
GET /reviews?page=1&limit=10&platform=Agoda&minRating=7&sortBy=rating&sortOrder=DESC
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 1,
      "hotelId": 123,
      "platform": "Agoda",
      "hotelName": "Grand Hotel",
      "hotelReviewId": 456789,
      "providerId": 332,
      "rating": 8.5,
      "reviewComments": "Excellent service and clean rooms...",
      "reviewDate": "2025-01-22T10:00:00.000Z",
      "formattedReviewDate": "Jan 22, 2025",
      "reviewTitle": "Amazing stay!",
      "ratingText": "Excellent",
      "reviewPositives": "Great location, friendly staff",
      "reviewNegatives": "Breakfast could be better",
      "reviewerCountryName": "United States",
      "reviewerDisplayName": "John D.",
      "lengthOfStay": 3,
      "reviewerReviewedCount": 15,
      "isExpertReviewer": false,
      "createdAt": "2025-01-22T10:00:00.000Z",
      "updatedAt": "2025-01-22T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "stats": {
    "totalReviews": 150,
    "averageRating": 7.8,
    "platformBreakdown": [
      {
        "platform": "Agoda",
        "count": 75,
        "averageRating": 7.9
      },
      {
        "platform": "Booking.com",
        "count": 75,
        "averageRating": 7.7
      }
    ],
    "ratingDistribution": [
      { "rating": 8, "count": 45 },
      { "rating": 7, "count": 60 },
      { "rating": 6, "count": 30 }
    ],
    "dateRange": {
      "earliest": "2024-01-01T00:00:00.000Z",
      "latest": "2025-01-22T23:59:59.000Z"
    }
  }
}
```

### 2. Get Review by ID

Retrieve a specific review by its ID.

**Endpoint:** `GET /reviews/:id`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Review ID |

**Example Request:**

```bash
GET /reviews/123
```

**Example Response:**

```json
{
  "id": 123,
  "hotelId": 456,
  "platform": "Agoda",
  "hotelName": "Grand Hotel",
  "hotelReviewId": 789012,
  "providerId": 332,
  "rating": 8.5,
  "reviewComments": "Excellent service and clean rooms...",
  "reviewDate": "2025-01-22T10:00:00.000Z",
  "formattedReviewDate": "Jan 22, 2025",
  "reviewTitle": "Amazing stay!",
  "ratingText": "Excellent",
  "reviewPositives": "Great location, friendly staff",
  "reviewNegatives": "Breakfast could be better",
  "reviewerCountryName": "United States",
  "reviewerDisplayName": "John D.",
  "lengthOfStay": 3,
  "reviewerReviewedCount": 15,
  "isExpertReviewer": false,
  "createdAt": "2025-01-22T10:00:00.000Z",
  "updatedAt": "2025-01-22T10:00:00.000Z"
}
```

### 3. Get Hotel Reviews

Retrieve reviews for a specific hotel.

**Endpoint:** `GET /reviews/hotels/:hotelId`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `hotelId` | number | Hotel ID |

**Query Parameters:**

Same as the main reviews endpoint, except `hotelId` is overridden by the path parameter.

**Example Request:**

```bash
GET /reviews/hotels/123?page=1&limit=5&sortBy=rating&sortOrder=DESC
```

**Example Response:**

Same format as the main reviews endpoint, but filtered to the specific hotel.

### 4. Get Review Statistics

Retrieve detailed statistics about reviews with optional filtering.

**Endpoint:** `GET /reviews/stats`

**Query Parameters:**

Same filtering parameters as the main reviews endpoint (excluding pagination and sorting).

**Example Request:**

```bash
GET /reviews/stats?platform=Agoda&minRating=7
```

**Example Response:**

```json
{
  "totalReviews": 1250,
  "averageRating": 7.8,
  "platformBreakdown": [
    {
      "platform": "Agoda",
      "count": 625,
      "averageRating": 7.9
    },
    {
      "platform": "Booking.com",
      "count": 425,
      "averageRating": 7.6
    },
    {
      "platform": "Expedia",
      "count": 200,
      "averageRating": 8.1
    }
  ],
  "ratingDistribution": [
    { "rating": 10, "count": 125 },
    { "rating": 9, "count": 200 },
    { "rating": 8, "count": 350 },
    { "rating": 7, "count": 300 },
    { "rating": 6, "count": 175 },
    { "rating": 5, "count": 75 },
    { "rating": 4, "count": 25 }
  ],
  "dateRange": {
    "earliest": "2024-01-01T00:00:00.000Z",
    "latest": "2025-01-22T23:59:59.000Z"
  }
}
```

### 5. Get Available Platforms

Retrieve a list of all available review platforms.

**Endpoint:** `GET /reviews/platforms`

**Example Request:**

```bash
GET /reviews/platforms
```

**Example Response:**

```json
{
  "platforms": [
    "Agoda",
    "Booking.com",
    "Expedia",
    "Hotels.com",
    "TripAdvisor"
  ]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "page must be a number conforming to the specified constraints",
    "limit must not be greater than 100"
  ],
  "error": "Bad Request"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Review with ID 999 not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Failed to fetch reviews",
  "error": "Internal Server Error"
}
```

## Usage Examples

### 1. Get Recent High-Rated Reviews

```bash
GET /reviews?minRating=8&sortBy=reviewDate&sortOrder=DESC&limit=10
```

### 2. Search for Reviews Mentioning "Service"

```bash
GET /reviews?search=service&sortBy=rating&sortOrder=DESC
```

### 3. Get Reviews for a Specific Date Range

```bash
GET /reviews?startDate=2025-01-01&endDate=2025-01-31&sortBy=reviewDate
```

### 4. Get Reviews from US Reviewers

```bash
GET /reviews?reviewerCountry=United%20States&sortBy=rating&sortOrder=DESC
```

### 5. Get Platform Statistics

```bash
GET /reviews/stats?startDate=2024-01-01&endDate=2024-12-31
```

### 6. Get Reviews with Statistics Included

```bash
GET /reviews?page=1&limit=20&includeStats=true
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## Caching

Responses are not cached by default. Consider implementing caching for frequently accessed data like statistics and platform lists.

## Performance Considerations

- Use pagination for large result sets
- Apply filters to reduce the amount of data processed
- Consider using the `includeStats` parameter only when needed, as statistics calculation can be expensive
- Database indexes are optimized for common query patterns (hotelId, platform, reviewDate, rating)

## Future Enhancements

- Authentication and authorization
- Rate limiting
- Response caching
- Real-time updates via WebSockets
- Export functionality (CSV, Excel)
- Advanced analytics endpoints
- Review sentiment analysis
- Bulk operations API