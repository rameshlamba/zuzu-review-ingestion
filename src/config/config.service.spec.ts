import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.TEST_STRING;
    delete process.env.TEST_NUMBER;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return environment variable value', () => {
      process.env.TEST_STRING = 'test-value';

      const result = service.get('TEST_STRING');

      expect(result).toBe('test-value');
    });

    it('should return undefined when env var is not set', () => {
      const result = service.get('NON_EXISTENT_VAR');

      expect(result).toBeUndefined();
    });
  });

  describe('getNumber', () => {
    it('should return parsed number from environment variable', () => {
      process.env.TEST_NUMBER = '42';

      const result = service.getNumber('TEST_NUMBER');

      expect(result).toBe(42);
    });

    it('should return NaN for invalid number strings', () => {
      process.env.TEST_NUMBER = 'not-a-number';

      const result = service.getNumber('TEST_NUMBER');

      expect(result).toBeNaN();
    });

    it('should return NaN when env var is not set', () => {
      const result = service.getNumber('NON_EXISTENT_NUMBER');

      expect(result).toBeNaN();
    });
  });

  describe('getBoolean', () => {
    it('should return true for "true" string', () => {
      process.env.TEST_BOOLEAN = 'true';

      const result = service.getBoolean('TEST_BOOLEAN');

      expect(result).toBe(true);
    });

    it('should return false for "false" string', () => {
      process.env.TEST_BOOLEAN = 'false';

      const result = service.getBoolean('TEST_BOOLEAN');

      expect(result).toBe(false);
    });

    it('should return false for any other value', () => {
      process.env.TEST_BOOLEAN = 'anything';

      const result = service.getBoolean('TEST_BOOLEAN');

      expect(result).toBe(false);
    });

    it('should return false when env var is not set', () => {
      const result = service.getBoolean('NON_EXISTENT_BOOLEAN');

      expect(result).toBe(false);
    });
  });
});
