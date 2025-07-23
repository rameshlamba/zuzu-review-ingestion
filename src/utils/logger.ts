interface LogContext {
  [key: string]: unknown;
}

export class Logger {
  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  static log(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.log(this.formatMessage('INFO', message, context));
  }

  static error(message: string, error?: Error | unknown): void {
    const errorContext =
      error instanceof Error ? { message: error.message, stack: error.stack } : error;
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('ERROR', message, errorContext as LogContext));
  }

  static warn(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('WARN', message, context));
  }

  static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }
}
