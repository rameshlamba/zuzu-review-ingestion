import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { Review, ProcessedFile } from './reviews.entity';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockReviewRepository = {
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProcessedFileRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(ProcessedFile),
          useValue: mockProcessedFileRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isFileProcessed', () => {
    it('should return true if file is already processed', async () => {
      mockProcessedFileRepository.findOne.mockResolvedValue({ fileName: 'test.jl' });

      const result = await service.isFileProcessed('test.jl');

      expect(result).toBe(true);
      expect(mockProcessedFileRepository.findOne).toHaveBeenCalledWith({
        where: { fileName: 'test.jl' },
      });
    });

    it('should return false if file is not processed', async () => {
      mockProcessedFileRepository.findOne.mockResolvedValue(null);

      const result = await service.isFileProcessed('test.jl');

      expect(result).toBe(false);
    });
  });

  describe('storeReviews', () => {
    const mockReviewData = [
      {
        hotelId: 123,
        platform: 'Agoda',
        hotelName: 'Test Hotel',
        comment: {
          hotelReviewId: 456,
          providerId: 789,
          rating: 8.5,
          reviewComments: 'Great hotel!',
          reviewDate: '2025-01-22T10:00:00Z',
          formattedRating: '8.5',
          formattedReviewDate: 'Jan 22, 2025',
          ratingText: 'Excellent',
          reviewProviderText: 'Agoda',
          reviewTitle: 'Amazing stay',
          translateSource: 'en',
          translateTarget: 'en',
          reviewerInfo: {
            countryName: 'USA',
            displayMemberName: 'John D.',
          },
        },
      },
    ];

    it('should store valid reviews and mark file as processed', async () => {
      mockReviewRepository.save.mockResolvedValue([]);
      mockProcessedFileRepository.save.mockResolvedValue({});

      await service.storeReviews(mockReviewData, 'test.jl');

      expect(mockReviewRepository.save).toHaveBeenCalled();
      expect(mockProcessedFileRepository.save).toHaveBeenCalled();
    });

    it('should skip invalid reviews', async () => {
      const invalidData = [
        { invalid: 'data' }, // Missing required fields
        { hotelId: 123 }, // Missing other required fields
      ];
      mockProcessedFileRepository.save.mockResolvedValue({});

      await service.storeReviews(invalidData, 'test.jl');

      expect(mockReviewRepository.save).not.toHaveBeenCalled();
      expect(mockProcessedFileRepository.save).toHaveBeenCalled();
    });

    it('should handle database save errors', async () => {
      const error = new Error('Database connection failed');
      mockReviewRepository.save.mockRejectedValue(error);
      mockProcessedFileRepository.save.mockResolvedValue({});

      await expect(service.storeReviews(mockReviewData, 'test.jl')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle processed file save errors', async () => {
      const error = new Error('Failed to mark file as processed');
      mockReviewRepository.save.mockResolvedValue([]);
      mockProcessedFileRepository.save.mockRejectedValue(error);

      await expect(service.storeReviews(mockReviewData, 'test.jl')).rejects.toThrow(
        'Failed to mark file as processed',
      );
    });

    it('should handle reviews with invalid rating range', async () => {
      const invalidRatingData = [
        {
          ...mockReviewData[0],
          comment: {
            ...mockReviewData[0].comment,
            rating: 15, // Invalid rating > 10
          },
        },
      ];
      mockProcessedFileRepository.save.mockResolvedValue({});

      await service.storeReviews(invalidRatingData, 'test.jl');

      expect(mockReviewRepository.save).not.toHaveBeenCalled();
      expect(mockProcessedFileRepository.save).toHaveBeenCalled();
    });

    it('should handle reviews with invalid date', async () => {
      const invalidDateData = [
        {
          ...mockReviewData[0],
          comment: {
            ...mockReviewData[0].comment,
            reviewDate: 'invalid-date',
          },
        },
      ];
      mockProcessedFileRepository.save.mockResolvedValue({});

      await service.storeReviews(invalidDateData, 'test.jl');

      expect(mockReviewRepository.save).not.toHaveBeenCalled();
      expect(mockProcessedFileRepository.save).toHaveBeenCalled();
    });

    it('should handle reviews with rating of 0', async () => {
      const zeroRatingData = [
        {
          ...mockReviewData[0],
          comment: {
            ...mockReviewData[0].comment,
            rating: 0, // Valid rating of 0
          },
        },
      ];
      mockReviewRepository.save.mockResolvedValue([]);
      mockProcessedFileRepository.save.mockResolvedValue({});

      await service.storeReviews(zeroRatingData, 'test.jl');

      expect(mockReviewRepository.save).toHaveBeenCalled();
      expect(mockProcessedFileRepository.save).toHaveBeenCalled();
    });

    it('should handle empty reviews array', async () => {
      mockProcessedFileRepository.save.mockResolvedValue({});

      await service.storeReviews([], 'test.jl');

      expect(mockReviewRepository.save).not.toHaveBeenCalled();
      expect(mockProcessedFileRepository.save).toHaveBeenCalled();
    });
  });

  describe('getReviewStats', () => {
    it('should return review statistics', async () => {
      mockReviewRepository.count.mockResolvedValue(100);
      mockProcessedFileRepository.count.mockResolvedValue(5);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ platform: 'Agoda', count: '50', avgRating: '7.5' }]),
      };

      mockReviewRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getReviewStats();

      expect(result).toEqual({
        totalReviews: 100,
        totalFiles: 5,
        platformStats: [{ platform: 'Agoda', count: '50', avgRating: '7.5' }],
      });
    });
  });
});
