import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

describe('IngestionController', () => {
  let controller: IngestionController;
  let mockIngestionService: jest.Mocked<IngestionService>;

  const mockIngestionService_obj = {
    getIngestionStatus: jest.fn(),
    triggerManualIngestion: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        {
          provide: IngestionService,
          useValue: mockIngestionService_obj,
        },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    mockIngestionService = module.get(IngestionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return ingestion status successfully', async () => {
      const mockStatus = {
        isRunning: false,
        stats: {
          totalReviews: 100,
          totalFiles: 5,
          platformStats: [{ platform: 'Agoda', count: '50', avgRating: '7.5' }],
        },
      };

      mockIngestionService.getIngestionStatus.mockResolvedValue(mockStatus);

      const result = await controller.getStatus();

      expect(result).toEqual({
        success: true,
        isRunning: false,
        stats: mockStatus.stats,
      });
      expect(mockIngestionService.getIngestionStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when getting status', async () => {
      const error = new Error('Database connection failed');
      mockIngestionService.getIngestionStatus.mockRejectedValue(error);

      const result = await controller.getStatus();

      expect(result).toEqual({
        success: false,
        message: 'Failed to get status',
        error: 'Database connection failed',
      });
      expect(mockIngestionService.getIngestionStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('triggerIngestion', () => {
    it('should trigger manual ingestion successfully', async () => {
      const mockResult = {
        processed: 5,
        skipped: 2,
        errors: 0,
      };

      mockIngestionService.triggerManualIngestion.mockResolvedValue(mockResult);

      const result = await controller.triggerIngestion();

      expect(result).toEqual({
        success: true,
        message: 'Ingestion completed successfully',
        result: mockResult,
      });
      expect(mockIngestionService.triggerManualIngestion).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during ingestion', async () => {
      const error = new Error('S3 connection failed');
      mockIngestionService.triggerManualIngestion.mockRejectedValue(error);

      const result = await controller.triggerIngestion();

      expect(result).toEqual({
        success: false,
        message: 'Ingestion failed',
        error: 'S3 connection failed',
      });
      expect(mockIngestionService.triggerManualIngestion).toHaveBeenCalledTimes(1);
    });

    it('should handle ingestion with errors', async () => {
      const mockResult = {
        processed: 3,
        skipped: 1,
        errors: 2,
      };

      mockIngestionService.triggerManualIngestion.mockResolvedValue(mockResult);

      const result = await controller.triggerIngestion();

      expect(result).toEqual({
        success: true,
        message: 'Ingestion completed successfully',
        result: mockResult,
      });
    });
  });
});