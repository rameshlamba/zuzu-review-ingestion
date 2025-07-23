export class ReviewResponseDto {
  id: number;
  hotelId: number;
  platform: string;
  hotelName: string;
  hotelReviewId: number;
  providerId: number;
  rating: number;
  reviewComments: string;
  reviewDate: Date;
  formattedReviewDate: string;
  reviewTitle: string;
  ratingText: string;
  reviewPositives?: string;
  reviewNegatives?: string;

  // Reviewer information
  reviewerCountryName?: string;
  reviewerDisplayName?: string;
  lengthOfStay?: number;
  reviewerReviewedCount?: number;
  isExpertReviewer: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewStatsDto {
  totalReviews: number;
  averageRating: number;
  platformBreakdown: Array<{
    platform: string;
    count: number;
    averageRating: number;
  }>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
}

export class PaginatedReviewResponseDto {
  data: ReviewResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: ReviewStatsDto;
}
