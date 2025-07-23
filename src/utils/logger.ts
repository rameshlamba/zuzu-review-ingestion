export class Logger {
  private static formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  static log(message: string, context?: any): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  static error(message: string, error?: any): void {
    const errorContext = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.formatMessage('ERROR', message, errorContext));
  }

  static warn(message: string, context?: any): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  static debug(message: string, context?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }
}