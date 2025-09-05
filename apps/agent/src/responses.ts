/**
 * Standard response utilities for Tides Agent
 */

import type { AgentResponse } from './types.js';

/**
 * Create a successful response
 */
export function createSuccessResponse<T>(data: T): Response {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create an error response
 */
export function createErrorResponse(message: string, status: number = 500, details?: any): Response {
  const response: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details !== undefined) {
    response.details = details;
  }

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(fieldErrors: Record<string, any>, message: string = 'Validation failed'): Response {
  return createErrorResponse(message, 400, {
    validation_errors: fieldErrors
  });
}

export class ResponseBuilder {
  /**
   * Create a successful response
   */
  static success<T>(data: T, service: string, processingTime: number): Response {
    const response: AgentResponse<T> = {
      success: true,
      data,
      metadata: {
        service,
        timestamp: new Date().toISOString(),
        processing_time_ms: processingTime
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  /**
   * Create an error response
   */
  static error(message: string, status: number = 500, service?: string): Response {
    const response: AgentResponse = {
      success: false,
      error: message,
      metadata: {
        service: service || 'coordinator',
        timestamp: new Date().toISOString(),
        processing_time_ms: 0
      }
    };

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  /**
   * Handle CORS preflight requests
   */
  static corsResponse(): Response {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  /**
   * Validate request method
   */
  static validateMethod(request: Request, allowedMethods: string[]): Response | null {
    if (!allowedMethods.includes(request.method)) {
      return this.error(
        `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
        405
      );
    }
    return null;
  }

  /**
   * Parse and validate JSON request body
   */
  static async parseRequestBody<T>(request: Request): Promise<{ data: T | null; error: Response | null }> {
    try {
      if (!request.body) {
        return {
          data: null,
          error: this.error('Request body is required', 400)
        };
      }

      const data = await request.json() as T;
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.error('Invalid JSON in request body', 400)
      };
    }
  }
}