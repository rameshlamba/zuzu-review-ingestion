import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Mock AWS S3 Client
jest.mock('@aws-sdk/client-s3');

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client: jest.Mocked<S3Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);
    mockS3Client = new S3Client({}) as jest.Mocked<S3Client>;
    (service as unknown as { client: jest.Mocked<S3Client> }).client = mockS3Client;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listFiles', () => {
    it('should list files from S3 bucket', async () => {
      const mockResponse = {
        Contents: [
          { Key: 'reviews/agoda_com_2025-04-10.jl' },
          { Key: 'reviews/booking_com_2025-04-10.jl' },
          { Key: 'reviews/other.txt' }, // Should be filtered out
        ],
      };

      mockS3Client.send = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.listFiles('test-bucket', 'reviews/');

      expect(result).toEqual([
        'reviews/agoda_com_2025-04-10.jl',
        'reviews/booking_com_2025-04-10.jl',
      ]);
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should handle empty bucket', async () => {
      const mockResponse = { Contents: [] };
      mockS3Client.send = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.listFiles('test-bucket', 'reviews/');

      expect(result).toEqual([]);
    });

    it('should handle S3 errors', async () => {
      mockS3Client.send = jest.fn().mockRejectedValue(new Error('S3 Error'));

      await expect(service.listFiles('test-bucket', 'reviews/')).rejects.toThrow('S3 Error');
    });
  });

  describe('streamJsonLines', () => {
    it('should stream file from S3', async () => {
      const mockStream = new Readable();
      mockS3Client.send = jest.fn().mockResolvedValue({ Body: mockStream });

      const result = await service.streamJsonLines('test-bucket', 'test-file.jl');

      expect(result).toBe(mockStream);
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      mockS3Client.send = jest.fn().mockRejectedValue(new Error('Stream Error'));

      await expect(service.streamJsonLines('test-bucket', 'test-file.jl')).rejects.toThrow(
        'Stream Error',
      );
    });
  });

  describe('parseJsonLines', () => {
    it('should parse valid JSON lines', async () => {
      const mockData = '{"test": "data1"}\n{"test": "data2"}\n';
      const mockStream = Readable.from([mockData]);

      const result = await service.parseJsonLines(mockStream);

      expect(result).toEqual([{ test: 'data1' }, { test: 'data2' }]);
    });

    it('should skip malformed JSON lines', async () => {
      const mockData = '{"test": "data1"}\n{invalid json}\n{"test": "data2"}\n';
      const mockStream = Readable.from([mockData]);

      const result = await service.parseJsonLines(mockStream);

      expect(result).toEqual([{ test: 'data1' }, { test: 'data2' }]);
    });

    it('should handle empty lines', async () => {
      const mockData = '{"test": "data1"}\n\n{"test": "data2"}\n';
      const mockStream = Readable.from([mockData]);

      const result = await service.parseJsonLines(mockStream);

      expect(result).toEqual([{ test: 'data1' }, { test: 'data2' }]);
    });
  });

  describe('getFileMetadata', () => {
    it('should return file metadata', async () => {
      const mockResponse = {
        ContentLength: 1024,
        LastModified: new Date('2025-04-10'),
      };

      mockS3Client.send = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.getFileMetadata('test-bucket', 'test-file.jl');

      expect(result).toEqual({
        size: 1024,
        lastModified: new Date('2025-04-10'),
      });
    });

    it('should handle missing metadata', async () => {
      const mockResponse = {};
      mockS3Client.send = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.getFileMetadata('test-bucket', 'test-file.jl');

      expect(result.size).toBe(0);
      expect(result.lastModified).toBeInstanceOf(Date);
    });
  });
});
