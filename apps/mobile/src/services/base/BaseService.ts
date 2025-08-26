// Base service class with common HTTP functionality

import { AuthService } from '../authService';
import type { HttpRequestOptions, HttpResponse, HttpError } from '../../types';
import { APP_CONFIG } from '../../constants';

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryOn: number[];
}

export interface ServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
  headers?: Record<string, string>;
}

export abstract class BaseService {
  protected baseUrl: string;
  protected timeout: number;
  protected retryConfig: RetryConfig;
  protected defaultHeaders: Record<string, string>;

  constructor(config?: ServiceConfig) {
    this.baseUrl = config?.baseUrl || '';
    this.timeout = config?.timeout || APP_CONFIG.api.defaultTimeout;
    this.retryConfig = {
      maxRetries: config?.retryConfig?.maxRetries || APP_CONFIG.api.maxRetries,
      retryDelay: config?.retryConfig?.retryDelay || 1000,
      retryOn: config?.retryConfig?.retryOn || [408, 429, 500, 502, 503, 504],
    };
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };
  }

  /**
   * Main request method with authentication, retry logic, and timeout
   */
  protected async request<T = any>(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const {
      timeout = this.timeout,
      retries = this.retryConfig.maxRetries,
      ...fetchOptions
    } = options;

    // Get authentication token
    const authHeaders = await this.getAuthHeaders();
    
    // Prepare final headers
    const headers = {
      ...this.defaultHeaders,
      ...authHeaders,
      ...fetchOptions.headers,
    };

    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers,
    };

    const fullUrl = this.buildUrl(url);
    this.logRequest('info', fullUrl, requestOptions);

    return this.executeWithRetry(fullUrl, requestOptions, timeout, retries);
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    timeout: number,
    retriesLeft: number,
    attempt: number = 1
  ): Promise<HttpResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseHeaders = this.extractHeaders(response);
      const data = await this.parseResponse<T>(response);

      if (!response.ok) {
        const error = this.createHttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );

        // Check if we should retry
        if (this.shouldRetry(response.status, retriesLeft)) {
          this.logRequest('warn', `Retrying request (attempt ${attempt + 1})`, { url, status: response.status });
          await this.delay(this.retryConfig.retryDelay * attempt);
          return this.executeWithRetry(url, options, timeout, retriesLeft - 1, attempt + 1);
        }

        throw error;
      }

      this.logRequest('info', `Request successful`, { url, status: response.status });

      return {
        data,
        status: response.status,
        headers: responseHeaders,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createHttpError('Request timeout', 408, null);
      }

      // Retry on network errors if retries left
      if (retriesLeft > 0 && this.isNetworkError(error)) {
        this.logRequest('warn', `Network error, retrying (attempt ${attempt + 1})`, { url, error });
        await this.delay(this.retryConfig.retryDelay * attempt);
        return this.executeWithRetry(url, options, timeout, retriesLeft - 1, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Get authentication headers
   */
  protected async getAuthHeaders(): Promise<Record<string, string>> {
    const apiKey = await AuthService.getApiKey();
    if (!apiKey) {
      return {};
    }
    return {
      Authorization: `Bearer ${apiKey}`,
    };
  }

  /**
   * Build full URL
   */
  protected buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    const base = this.baseUrl.replace(/\/$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  /**
   * Parse response based on content type
   */
  protected async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType?.includes('text/event-stream')) {
      // Parse SSE format for MCP responses
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6);
          try {
            return JSON.parse(jsonStr) as T;
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
      
      // If no valid data found, return the raw text
      return text as unknown as T;
    } else if (contentType?.includes('text/')) {
      return response.text() as unknown as T;
    } else {
      return response.blob() as unknown as T;
    }
  }

  /**
   * Extract headers from response
   */
  protected extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * Check if we should retry the request
   */
  protected shouldRetry(status: number, retriesLeft: number): boolean {
    return retriesLeft > 0 && this.retryConfig.retryOn.includes(status);
  }

  /**
   * Check if error is a network error
   */
  protected isNetworkError(error: any): boolean {
    return error instanceof TypeError && error.message === 'Network request failed';
  }

  /**
   * Create HTTP error
   */
  protected createHttpError(message: string, status?: number, response?: any): HttpError {
    const error = new Error(message) as HttpError;
    error.name = 'HttpError';
    error.status = status;
    error.response = response;
    return error;
  }

  /**
   * Delay helper for retries
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging helper
   */
  protected logRequest(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!APP_CONFIG.logging.enabled) return;

    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = logLevels[APP_CONFIG.logging.level as keyof typeof logLevels];
    const messageLevel = logLevels[level];

    if (messageLevel >= currentLevel) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${this.constructor.name}] ${message}`;
      
      if (data) {
        console[level](logMessage, data);
      } else {
        console[level](logMessage);
      }
    }
  }

  // Convenience methods for common HTTP verbs
  protected get<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  protected post<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected put<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected delete<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  protected patch<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}