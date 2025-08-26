class LoggingService {
  info(service: string, message: string, data?: any) {
    console.log(`[${service}] ${message}`, data || '');
  }

  error(service: string, message: string, data?: any) {
    console.error(`[${service}] ${message}`, data || '');
  }

  warn(service: string, message: string, data?: any) {
    console.warn(`[${service}] ${message}`, data || '');
  }

  debug(service: string, message: string, data?: any) {
    console.debug(`[${service}] ${message}`, data || '');
  }
}

export const loggingService = new LoggingService();