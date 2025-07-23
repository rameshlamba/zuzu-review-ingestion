import { Test, TestingModule } from '@nestjs/testing';
import { CronTask } from './cron.task';
import { IngestionService } from './ingestion.service';

describe('CronTask', () => {
  let cronTask: CronTask;
  let mockIngestionService: jest.Mocked<IngestionService>;

  const mockIngestionService_obj = {
    runIngestion: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronTask,
        {
          provide: IngestionService,
          useValue: mockIngestionService_obj,
        },
      ],
    }).compile();

    cronTask = module.get<CronTask>(CronTask);
    mockIngestionService = module.get(IngestionService);
  });

  it('should be defined', () => {
    expect(cronTask).toBeDefined();
  });

  describe('handleDailyIngestion', () => {
    it('should run daily ingestion successfully', async () => {
      const mockResult = {
        processed: 10,
        skipped: 2,
        errors: 0,
      };

      mockIngestionService.runIngestion.mockResolvedValue(mockResult);

      await cronTask.handleDailyIngestion();

      expect(mockIngestionService.runIngestion).toHaveBeenCalledTimes(1);
    });

    it('should handle ingestion errors gracefully', async () => {
      const error = new Error('Ingestion failed');
      mockIngestionService.runIngestion.mockRejectedValue(error);

      // Should not throw - errors are handled internally
      await expect(cronTask.handleDailyIngestion()).resolves.toBeUndefined();
      expect(mockIngestionService.runIngestion).toHaveBeenCalledTimes(1);
    });

    it('should handle ingestion with some errors', async () => {
      const mockResult = {
        processed: 5,
        skipped: 1,
        errors: 3,
      };

      mockIngestionService.runIngestion.mockResolvedValue(mockResult);

      await cronTask.handleDailyIngestion();

      expect(mockIngestionService.runIngestion).toHaveBeenCalledTimes(1);
    });
  });
});