import { Logger } from './logger';

describe('Logger', () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log', () => {
    it('should log info messages', () => {
      Logger.log('Test message');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test message')
      );
    });

    it('should log info messages with context', () => {
      Logger.log('Test message', { key: 'value' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test message | Context: {"key":"value"}')
      );
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      Logger.error('Error message');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message')
      );
    });

    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      Logger.error('Error occurred', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error occurred')
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    it('should log error messages with custom context', () => {
      Logger.error('Error occurred', { custom: 'context' });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error occurred | Context: {"custom":"context"}')
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      Logger.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      );
    });

    it('should log warning messages with context', () => {
      Logger.warn('Warning message', { warning: 'context' });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message | Context: {"warning":"context"}')
      );
    });
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      
      Logger.debug('Debug message');

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Debug message')
      );
    });

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      
      Logger.debug('Debug message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should log debug messages with context in development', () => {
      process.env.NODE_ENV = 'development';
      
      Logger.debug('Debug message', { debug: 'context' });

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Debug message | Context: {"debug":"context"}')
      );
    });
  });

  describe('formatMessage', () => {
    it('should format messages with timestamp', () => {
      const message = (Logger as any).formatMessage('INFO', 'Test message');
      
      expect(message).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message$/);
    });

    it('should format messages with context', () => {
      const message = (Logger as any).formatMessage('INFO', 'Test message', { key: 'value' });
      
      expect(message).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message \| Context: {"key":"value"}$/);
    });
  });
});