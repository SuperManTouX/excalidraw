import consola from 'consola';

/**
 * 结构化日志配置选项
 */
export interface StructuredLoggerOptions {
  level?: number;
  showColors?: boolean;
  showDate?: boolean;
  showBadge?: boolean;
  compact?: boolean;
  libraryName?: string;
  dateFormat?: string;
}

/**
 * 结构化日志器类
 */
export class Logger {
  private logger: any;
  private libraryName: string;

  constructor(options: Partial<StructuredLoggerOptions> = {}) {
    this.libraryName = options.libraryName || 'consola';
    
    // 创建consola实例 - 使用默认reporter配置
    this.logger = consola.create({
      level: options.level ?? 4
    });
  }

  /**
   * 基础日志方法
   */
  trace(...args: any[]): void {
    this.logger.trace(`[${this.libraryName}]`, ...args);
  }

  debug(...args: any[]): void {
    this.logger.debug(`[${this.libraryName}]`, ...args);
  }

  info(...args: any[]): void {
    this.logger.info(`[${this.libraryName}]`, ...args);
  }

  log(...args: any[]): void {
    this.logger.log(`[${this.libraryName}]`, ...args);
  }

  success(...args: any[]): void {
    this.logger.success(`[${this.libraryName}]`, ...args);
  }

  warn(...args: any[]): void {
    this.logger.warn(`[${this.libraryName}]`, ...args);
  }

  error(...args: any[]): void {
    this.logger.error(`[${this.libraryName}]`, ...args);
  }

  fatal(...args: any[]): void {
    this.logger.fatal(`[${this.libraryName}]`, ...args);
  }

  /**
   * 结构化日志方法 - API请求
   */
  apiRequest(
    method: string,
    url: string,
    status: number,
    metadata?: Record<string, any>
  ): void {
    this.info({
      type: 'api_request',
      method,
      url,
      status,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * 结构化日志方法 - 用户操作
   */
  userAction(
    userId: string,
    action: string,
    details?: Record<string, any>
  ): void {
    this.debug({
      type: 'user_action',
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * 结构化日志方法 - 性能指标
   */
  performanceMetric(
    metric: string,
    value: number,
    unit: string,
    context?: Record<string, any>
  ): void {
    this.info({
      type: 'performance_metric',
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * 结构化日志方法 - 错误信息
   */
  structuredError(
    error: Error,
    context?: Record<string, any>
  ): void {
    this.error({
      type: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * 结构化日志方法 - 组件生命周期
   */
  componentLifecycle(
    component: string,
    lifecycle: string,
    state?: Record<string, any>
  ): void {
    this.debug({
      type: 'component_lifecycle',
      component,
      lifecycle,
      timestamp: new Date().toISOString(),
      state
    });
  }

  /**
   * 结构化日志方法 - 业务事件
   */
  businessEvent(
    event: string,
    data?: Record<string, any>
  ): void {
    this.info({
      type: 'business_event',
      event,
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}

/**
 * 创建默认的结构化日志器实例
 */
export const createLogger = (options?: StructuredLoggerOptions): Logger => {
  return new Logger(options);
};

/**
 * 默认导出单例实例
 */
export const DefaultLogger = createLogger();












