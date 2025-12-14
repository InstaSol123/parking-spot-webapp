import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file streams
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });

/**
 * Log levels
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

/**
 * Logger utility
 */
export class Logger {
  private static formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  private static writeLog(level: LogLevel, message: string, meta?: any) {
    const timestamp = this.formatDate(new Date());
    const logEntry = `[${timestamp}] ${level}: ${message}${meta ? ` | Meta: ${JSON.stringify(meta)}` : ''}\n`;
    
    // Write to console
    switch (level) {
      case LogLevel.ERROR:
        console.error(logEntry);
        errorLogStream.write(logEntry);
        break;
      case LogLevel.WARN:
        console.warn(logEntry);
        errorLogStream.write(logEntry);
        break;
      default:
        console.log(logEntry);
        accessLogStream.write(logEntry);
    }
  }

  static info(message: string, meta?: any) {
    this.writeLog(LogLevel.INFO, message, meta);
  }

  static warn(message: string, meta?: any) {
    this.writeLog(LogLevel.WARN, message, meta);
  }

  static error(message: string, meta?: any) {
    this.writeLog(LogLevel.ERROR, message, meta);
  }

  static debug(message: string, meta?: any) {
    this.writeLog(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log HTTP requests
   */
  static logRequest(method: string, url: string, statusCode: number, responseTime: number) {
    const message = `${method} ${url} ${statusCode} ${responseTime}ms`;
    this.info(`HTTP Request: ${message}`);
  }
}

// Gracefully close log streams on exit
process.on('exit', () => {
  accessLogStream.close();
  errorLogStream.close();
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  accessLogStream.close();
  errorLogStream.close();
  process.exit(0);
});