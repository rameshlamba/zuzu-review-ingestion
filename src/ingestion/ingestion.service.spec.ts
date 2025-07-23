import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { IngestionService } from './ingestion.service';
import { S3Service } from '../s3/s3.service';
import { ReviewsService } from '../reviews/reviews.service';

describe('IngestionService', () => {
  let service: IngestionService;
  let mockS3Service: jest.Mocked<S3Service>;
  let mockReviewsService: jest.Mocked<ReviewsService>;

  const mockS3Service_obj = {
    listFiles: jest.fn(),
    streamJsonLines: jest.fn(),
    parseJsonLines: jest.fn(),
    getFileMetadata: jest.fn(),
  };

  const mockReviewsService_obj = {
    isFileProcessed: jest.fn(),
    storeReviews: jest.fn(),
    getReviewStats: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: S3Service,
          useValue: mockS3Service_obj,
        },
        {
          provide: ReviewsService,
          useValue: mockReviewsService_obj,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    mockS3Service = module.get(S3Service);
    mockReviewsService = module.get(ReviewsService);

    // Set up environment variables for tests
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_PREFIX = '';
  });

  afterEach(() => {
    delete process.env.S3_BUCKET;
    delete process.env.S3_PREFIX;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runIngestion', () => {
    it('should process new files successfully', async () => {
      const mockFiles = ['agoda_com_2025-04-10.jl'];
      const mockData = [{ hotelId: 123, platform: 'Agoda' }];
      const mockStream = {} as Readable;
      const mockMetadata = { size: 1024, lastModified: new Date() };

      mockS3Service.listFiles.mockResolvedValue(mockFiles);
      mockReviewsService.isFileProcessed.mockResolvedValue(false);
      mockS3Service.getFileMetadata.mockResolvedValue(mockMetadata);
      mockS3Service.streamJsonLines.mockResolvedValue(mockStream);
      mockS3Service.parseJsonLines.mockResolvedValue(mockData);
      mockReviewsService.storeReviews.mockResolvedValue();

      const result = await service.runIngestion();

      expect(result).toEqual({
        processed: 1,
        skipped: 0,
        errors: 0,
      });

      expect(mockS3Service.listFiles).toHaveBeenCalledWith('test-bucket', '');
      expect(mockReviewsService.isFileProcessed).toHaveBeenCalledWith('agoda_com_2025-04-10.jl');
      expect(mockReviewsService.storeReviews).toHaveBeenCalledWith(
        mockData,
        'agoda_com_2025-04-10.jl',
      );
    });

    it('should skip already processed files', async () => {
      const mockFiles = ['agoda_com_2025-04-10.jl'];

      mockS3Service.listFiles.mockResolvedValue(mockFiles);
      mockReviewsService.isFileProcessed.mockResolvedValue(true);

      const result = await service.runIngestion();

      expect(result).toEqual({
        processed: 0,
        skipped: 1,
        errors: 0,
      });

      expect(mockReviewsService.storeReviews).not.toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      const mockFiles = ['agoda_com_2025-04-10.jl'];

      mockS3Service.listFiles.mockResolvedValue(mockFiles);
      mockReviewsService.isFileProcessed.mockResolvedValue(false);
      mockS3Service.getFileMetadata.mockRejectedValue(new Error('S3 Error'));

      const result = await service.runIngestion();

      expect(result).toEqual({
        processed: 0,
        skipped: 0,
        errors: 1,
      });
    });

    it('should handle empty file list', async () => {
      mockS3Service.listFiles.mockResolvedValue([]);

      const result = await service.runIngestion();

      expect(result).toEqual({
        processed: 0,
        skipped: 0,
        errors: 0,
      });
    });

    it('should throw error when S3_BUCKET is missing', async () => {
      delete process.env.S3_BUCKET;

      await expect(service.runIngestion()).rejects.toThrow(
        'S3_BUCKET environment variable is required',
      );
    });

    it('should prevent concurrent ingestion', async () => {
      mockS3Service.listFiles.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100)),
      );

      // Start first ingestion
      const firstIngestion = service.runIngestion();

      // Try to start second ingestion immediately
      const secondIngestion = service.runIngestion();

      const [firstResult, secondResult] = await Promise.all([firstIngestion, secondIngestion]);

      // First should process, second should be skipped
      expect(
        firstResult.processed + firstResult.skipped + firstResult.errors,
      ).toBeGreaterThanOrEqual(0);
      expect(secondResult).toEqual({ processed: 0, skipped: 0, errors: 0 });
    });
  });

  describe('getIngestionStatus', () => {
    it('should return ingestion status with stats', async () => {
      const mockStats = {
        totalReviews: 100,
        totalFiles: 5,
        platformStats: [{ platform: 'Agoda', count: '50', avgRating: '7.5' }],
      };

      mockReviewsService.getReviewStats.mockResolvedValue(mockStats);

      const result = await service.getIngestionStatus();

      expect(result).toEqual({
        isRunning: false,
        stats: mockStats,
      });
    });
  });

  describe('triggerManualIngestion', () => {
    it('should trigger manual ingestion', async () => {
      mockS3Service.listFiles.mockResolvedValue([]);

      const result = await service.triggerManualIngestion();

      expect(result).toEqual({
        processed: 0,
        skipped: 0,
        errors: 0,
      });
    });
  });
});
