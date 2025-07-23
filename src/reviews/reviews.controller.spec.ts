import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewQueryDto } from './dto/review-query.dto';
import { PaginatedReviewResponseDto, ReviewResponseDto, ReviewStatsDto } from './dto/review-response.dto';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let mockReviewsService: jest.Mocked<ReviewsService>;

  const mockReviewsService_obj = {
    findReviews: jest.fn(),
    findReviewById: jest.fn(),
    getDetailedStats: jest.fn(),
    getAvailablePlatforms: jest.fn(),
  };

  const mockReview: ReviewResponseDto = {
    id: 1,
    hotelId: 123,
    platform: 'Agoda',
    hotelName: 'Test Hotel',
    hotelReviewId: 456,
    providerId: 789,
    rating: 8.5,
    reviewComments: 'Great hotel experience!',
    reviewDate: new Date('2025-01-22'),
    formattedReviewDate: 'Jan 22, 2025',
    reviewTitle: 'Amazing stay',
    ratingText: 'Excellent',
    reviewPositives: 'Clean rooms, great service',
    reviewNegatives: 'Noisy at night',
    reviewerCountryName: 'USA',
    reviewerDisplayName: 'John D.',
    lengthOfStay: 3,
    reviewerReviewedCount: 15,
    isExpertReviewer: false,
    createdAt: new Date('2025-01-22'),
    updatedAt: new Date('2025-01-22'),
  };

  const mockPaginatedResponse: PaginatedReviewResponseDto = {
    data: [mockReview],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  const mockStats: ReviewStatsDto = {
    totalReviews: 100,
    averageRating: 7.5,
    platformBreakdown: [
      { platform: 'Agoda', count: 50, averageRating: 7.8 },
      { platform: 'Booking.com', count: 50, averageRating: 7.2 },
    ],
    ratingDistribution: [
      { rating: 8, count: 30 },
      { rating: 7, count: 40 },
      { rating: 6, count: 30 },
    ],
    dateRange: {
      earliest: new Date('2024-01-01'),
      latest: new Date('2025-01-22'),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService_obj,
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    mockReviewsService = module.get(ReviewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getReviews', () => {
    it('should return paginated reviews', async () => {
      const query: ReviewQueryDto = { page: 1, limit: 20 };
      mockReviewsService.findReviews.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getReviews(query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockReviewsService.findReviews).toHaveBeenCalledWith(query);
    });

    it('should handle service errors', async () => {
      const query: ReviewQueryDto = { page: 1, limit: 20 };
      mockReviewsService.findReviews.mockRejectedValue(new Error('Database error'));

      await expect(controller.getReviews(query)).rejects.toThrow(HttpException);
    });

    it('should apply filters correctly', async () => {
      const query: ReviewQueryDto = {
        page: 1,
        limit: 10,
        hotelId: 123,
        platform: 'Agoda',
        minRating: 7,
        maxRating: 9,
      };
      mockReviewsService.findReviews.mockResolvedValue(mockPaginatedResponse);

      await controller.getReviews(query);

      expect(mockReviewsService.findReviews).toHaveBeenCalledWith(query);
    });
  });

  describe('getReviewStats', () => {
    it('should return review statistics', async () => {
      const query: ReviewQueryDto = {};
      mockReviewsService.getDetailedStats.mockResolvedValue(mockStats);

      const result = await controller.getReviewStats(query);

      expect(result).toEqual(mockStats);
      expect(mockReviewsService.getDetailedStats).toHaveBeenCalledWith(query);
    });

    it('should handle service errors', async () => {
      const query: ReviewQueryDto = {};
      mockReviewsService.getDetailedStats.mockRejectedValue(new Error('Database error'));

      await expect(controller.getReviewStats(query)).rejects.toThrow(HttpException);
    });
  });

  describe('getPlatforms', () => {
    it('should return available platforms', async () => {
      const platforms = ['Agoda', 'Booking.com', 'Expedia'];
      mockReviewsService.getAvailablePlatforms.mockResolvedValue(platforms);

      const result = await controller.getPlatforms();

      expect(result).toEqual({ platforms });
      expect(mockReviewsService.getAvailablePlatforms).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockReviewsService.getAvailablePlatforms.mockRejectedValue(new Error('Database error'));

      await expect(controller.getPlatforms()).rejects.toThrow(HttpException);
    });
  });

  describe('getHotelReviews', () => {
    it('should return reviews for specific hotel', async () => {
      const hotelId = 123;
      const query: ReviewQueryDto = { page: 1, limit: 20 };
      const expectedQuery = { ...query, hotelId };
      mockReviewsService.findReviews.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getHotelReviews(hotelId, query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockReviewsService.findReviews).toHaveBeenCalledWith(expectedQuery);
    });

    it('should throw 404 when no reviews found for hotel', async () => {
      const hotelId = 999;
      const query: ReviewQueryDto = { page: 1, limit: 20 };
      const emptyResponse = {
        ...mockPaginatedResponse,
        data: [],
        pagination: { ...mockPaginatedResponse.pagination, total: 0 },
      };
      mockReviewsService.findReviews.mockResolvedValue(emptyResponse);

      await expect(controller.getHotelReviews(hotelId, query)).rejects.toThrow(
        new HttpException(`No reviews found for hotel ID ${hotelId}`, HttpStatus.NOT_FOUND)
      );
    });

    it('should handle service errors', async () => {
      const hotelId = 123;
      const query: ReviewQueryDto = { page: 1, limit: 20 };
      mockReviewsService.findReviews.mockRejectedValue(new Error('Database error'));

      await expect(controller.getHotelReviews(hotelId, query)).rejects.toThrow(HttpException);
    });
  });

  describe('getReviewById', () => {
    it('should return review by ID', async () => {
      const reviewId = 1;
      mockReviewsService.findReviewById.mockResolvedValue(mockReview);

      const result = await controller.getReviewById(reviewId);

      expect(result).toEqual(mockReview);
      expect(mockReviewsService.findReviewById).toHaveBeenCalledWith(reviewId);
    });

    it('should throw 404 when review not found', async () => {
      const reviewId = 999;
      mockReviewsService.findReviewById.mockResolvedValue(null);

      await expect(controller.getReviewById(reviewId)).rejects.toThrow(
        new HttpException(`Review with ID ${reviewId} not found`, HttpStatus.NOT_FOUND)
      );
    });

    it('should handle service errors', async () => {
      const reviewId = 1;
      mockReviewsService.findReviewById.mockRejectedValue(new Error('Database error'));

      await expect(controller.getReviewById(reviewId)).rejects.toThrow(HttpException);
    });
  });
});