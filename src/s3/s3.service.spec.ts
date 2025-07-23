import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { Readable } from 'stream';

// Mock AWS S3 Client
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  ListObjectsV2Command: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);
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

      mockSend.mockResolvedValue(mockResponse);

      const result = await service.listFiles('test-bucket', 'reviews/');

      expect(result).toEqual([
        'reviews/agoda_com_2025-04-10.jl',
        'reviews/booking_com_2025-04-10.jl',
      ]);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle empty bucket', async () => {
      const mockResponse = { Contents: [] };
      mockSend.mockResolvedValue(mockResponse);

      const result = await service.listFiles('test-bucket', 'reviews/');

      expect(result).toEqual([]);
    });

    it('should handle S3 errors', async () => {
      mockSend.mockRejectedValue(new Error('S3 Error'));

      await expect(service.listFiles('test-bucket', 'reviews/')).rejects.toThrow('S3 Error');
    });
  });

  describe('streamJsonLines', () => {
    it('should stream file from S3', async () => {
      const mockStream = new Readable();
      mockSend.mockResolvedValue({ Body: mockStream });

      const result = await service.streamJsonLines('test-bucket', 'test-file.jl');

      expect(result).toBe(mockStream);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      mockSend.mockRejectedValue(new Error('Stream Error'));

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

      mockSend.mockResolvedValue(mockResponse);

      const result = await service.getFileMetadata('test-bucket', 'test-file.jl');

      expect(result).toEqual({
        size: 1024,
        lastModified: new Date('2025-04-10'),
      });
    });

    it('should handle missing metadata', async () => {
      const mockResponse = {};
      mockSend.mockResolvedValue(mockResponse);

      const result = await service.getFileMetadata('test-bucket', 'test-file.jl');

      expect(result.size).toBe(0);
      expect(result.lastModified).toBeInstanceOf(Date);
    });

    it('should handle metadata errors', async () => {
      mockSend.mockRejectedValue(new Error('Metadata Error'));

      await expect(service.getFileMetadata('test-bucket', 'test-file.jl')).rejects.toThrow(
        'Metadata Error',
      );
    });
  });

  describe('listFiles with pagination', () => {
    it('should handle paginated results', async () => {
      const mockResponse1 = {
        Contents: [{ Key: 'reviews/file1.jl' }, { Key: 'reviews/file2.jl' }],
        NextContinuationToken: 'token123',
      };

      const mockResponse2 = {
        Contents: [{ Key: 'reviews/file3.jl' }],
      };

      mockSend.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const result = await service.listFiles('test-bucket', 'reviews/');

      expect(result).toEqual(['reviews/file1.jl', 'reviews/file2.jl', 'reviews/file3.jl']);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should filter out non-JSONL files', async () => {
      const mockResponse = {
        Contents: [
          { Key: 'reviews/file1.jl' },
          { Key: 'reviews/file2.jsonl' },
          { Key: 'reviews/file3.txt' },
          { Key: 'reviews/file4.json' },
          { Key: 'reviews/' }, // Folder itself
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await service.listFiles('test-bucket', 'reviews/');

      expect(result).toEqual(['reviews/file1.jl', 'reviews/file2.jsonl']);
    });
  });

  describe('streamJsonLines edge cases', () => {
    it('should handle empty response body', async () => {
      mockSend.mockResolvedValue({ Body: null });

      await expect(service.streamJsonLines('test-bucket', 'test-file.jl')).rejects.toThrow(
        'Empty response body for test-file.jl',
      );
    });
  });

  describe('parseJsonLines edge cases', () => {
    it('should handle stream errors', async () => {
      const mockStream = new Readable({
        read() {
          this.emit('error', new Error('Stream read error'));
        },
      });

      await expect(service.parseJsonLines(mockStream)).rejects.toThrow('Stream read error');
    });

    it('should handle very long lines', async () => {
      const longLine = '{"data": "' + 'x'.repeat(200) + '"}';
      const mockData = `${longLine}\n`;
      const mockStream = Readable.from([mockData]);

      const result = await service.parseJsonLines(mockStream);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('data');
    });
  });
});
