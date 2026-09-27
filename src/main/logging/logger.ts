import { LogLevel, LogContext } from '../../shared/types/logging';
import { LoggerService } from './logger-service';

export interface ILogger {
  trace(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  fatal(message: string, context?: LogContext): void;
  time<T>(operation: string, context: LogContext | undefined, fn: () => Promise<T> | T): Promise<T>;
  child(defaultContext: LogContext): ILogger;
}

export class Logger implements ILogger {
  private service: LoggerService;
  private defaultContext: LogContext;

  constructor(defaultContext: LogContext = {}, service?: LoggerService) {
    this.service = service || LoggerService.getInstance();
    this.defaultContext = defaultContext;
  }

  private mergeContext(context?: LogContext): LogContext {
    if (!context) return { ...this.defaultContext };
    return {
      ...this.defaultContext,
      ...context,
      metadata: {
        ...(this.defaultContext.metadata || {}),
        ...(context.metadata || {}),
      },
    };
  }

  public trace(message: string, context?: LogContext): void {
    this.service.log(LogLevel.TRACE, message, this.mergeContext(context));
  }

  public debug(message: string, context?: LogContext): void {
    this.service.log(LogLevel.DEBUG, message, this.mergeContext(context));
  }

  public info(message: string, context?: LogContext): void {
    this.service.log(LogLevel.INFO, message, this.mergeContext(context));
  }

  public warn(message: string, context?: LogContext): void {
    this.service.log(LogLevel.WARN, message, this.mergeContext(context));
  }

  public error(message: string, context?: LogContext): void {
    this.service.log(LogLevel.ERROR, message, this.mergeContext(context));
  }

  public fatal(message: string, context?: LogContext): void {
    this.service.log(LogLevel.FATAL, message, this.mergeContext(context));
  }

  public time<T>(
    operation: string,
    context: LogContext | undefined,
    fn: () => Promise<T> | T
  ): Promise<T> {
    return this.service.time(operation, this.mergeContext(context), fn);
  }

  public child(defaultContext: LogContext): ILogger {
    return new Logger(this.mergeContext(defaultContext), this.service);
  }
}

// Global logger instance for main process
export const logger = new Logger({ source: 'main' });
