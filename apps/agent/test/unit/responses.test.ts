/**
 * Unit Tests for Response utilities
 */

import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '../../src/responses';

describe('Response Utilities', () => {
  describe('createSuccessResponse', () => {
    test('should create successful response with data', () => {
      const data = { message: 'Success', value: 42 };
      const response = createSuccessResponse(data);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      // Parse the response body to verify structure
      return response.json().then(body => {
        expect(body.success).toBe(true);
        expect(body.data).toEqual(data);
        expect(body.timestamp).toBeDefined();
        expect(new Date(body.timestamp).getTime()).toBeCloseTo(Date.now(), -3); // Within 1 second
      });
    });

    test('should handle null data', () => {
      const response = createSuccessResponse(null);

      expect(response.status).toBe(200);
      
      return response.json().then(body => {
        expect(body.success).toBe(true);
        expect(body.data).toBeNull();
      });
    });

    test('should handle undefined data', () => {
      const response = createSuccessResponse(undefined);

      expect(response.status).toBe(200);
      
      return response.json().then(body => {
        expect(body.success).toBe(true);
        expect(body.data).toBeUndefined();
      });
    });

    test('should handle complex nested data structures', () => {
      const complexData = {
        users: [
          { id: 1, name: 'John', preferences: { theme: 'dark' } },
          { id: 2, name: 'Jane', preferences: { theme: 'light' } }
        ],
        metadata: {
          total: 2,
          pagination: { page: 1, limit: 10 }
        },
        nested: {
          level1: {
            level2: {
              level3: 'deep value'
            }
          }
        }
      };

      const response = createSuccessResponse(complexData);

      return response.json().then(body => {
        expect(body.data).toEqual(complexData);
        expect(body.data.users).toHaveLength(2);
        expect(body.data.nested.level1.level2.level3).toBe('deep value');
      });
    });

    test('should include correct timestamp format', () => {
      const response = createSuccessResponse({ test: true });

      return response.json().then(body => {
        expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
      });
    });
  });

  describe('createErrorResponse', () => {
    test('should create error response with message and status', () => {
      const message = 'Something went wrong';
      const status = 400;
      const response = createErrorResponse(message, status);

      expect(response.status).toBe(status);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      return response.json().then(body => {
        expect(body.success).toBe(false);
        expect(body.error).toBe(message);
        expect(body.timestamp).toBeDefined();
      });
    });

    test('should default to status 500 when not provided', () => {
      const response = createErrorResponse('Server error');

      expect(response.status).toBe(500);
      
      return response.json().then(body => {
        expect(body.success).toBe(false);
        expect(body.error).toBe('Server error');
      });
    });

    test('should handle different HTTP status codes', () => {
      const testCases = [
        { message: 'Bad Request', status: 400 },
        { message: 'Unauthorized', status: 401 },
        { message: 'Forbidden', status: 403 },
        { message: 'Not Found', status: 404 },
        { message: 'Method Not Allowed', status: 405 },
        { message: 'Internal Server Error', status: 500 },
        { message: 'Bad Gateway', status: 502 },
        { message: 'Service Unavailable', status: 503 }
      ];

      const promises = testCases.map(({ message, status }) => {
        const response = createErrorResponse(message, status);
        expect(response.status).toBe(status);
        
        return response.json().then(body => {
          expect(body.error).toBe(message);
        });
      });

      return Promise.all(promises);
    });

    test('should include error details when provided', () => {
      const message = 'Validation failed';
      const details = {
        field: 'email',
        code: 'INVALID_FORMAT',
        expected: 'valid email address'
      };
      const response = createErrorResponse(message, 400, details);

      return response.json().then(body => {
        expect(body.success).toBe(false);
        expect(body.error).toBe(message);
        expect(body.details).toEqual(details);
      });
    });

    test('should handle null and undefined details', () => {
      const response1 = createErrorResponse('Error', 400, null);
      const response2 = createErrorResponse('Error', 400, undefined);

      return Promise.all([
        response1.json().then(body => expect(body.details).toBeNull()),
        response2.json().then(body => expect(body.details).toBeUndefined())
      ]);
    });

    test('should include timestamp in error response', () => {
      const response = createErrorResponse('Test error');

      return response.json().then(body => {
        expect(body.timestamp).toBeDefined();
        expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });
  });

  describe('createValidationErrorResponse', () => {
    test('should create validation error response with field errors', () => {
      const fieldErrors = {
        email: 'Invalid email format',
        password: 'Password must be at least 8 characters',
        age: 'Age must be a number'
      };

      const response = createValidationErrorResponse(fieldErrors);

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      return response.json().then(body => {
        expect(body.success).toBe(false);
        expect(body.error).toBe('Validation failed');
        expect(body.details).toEqual({
          validation_errors: fieldErrors
        });
        expect(body.timestamp).toBeDefined();
      });
    });

    test('should handle empty field errors object', () => {
      const response = createValidationErrorResponse({});

      return response.json().then(body => {
        expect(body.details.validation_errors).toEqual({});
      });
    });

    test('should handle complex field error structures', () => {
      const complexErrors = {
        'user.profile.name': 'Name is required',
        'user.preferences.theme': 'Must be either light or dark',
        'settings[0].value': 'Invalid configuration value',
        'nested.array[1].field': 'Field validation failed'
      };

      const response = createValidationErrorResponse(complexErrors);

      return response.json().then(body => {
        expect(body.details.validation_errors).toEqual(complexErrors);
      });
    });

    test('should include custom message when provided', () => {
      const fieldErrors = { name: 'Required field' };
      const customMessage = 'Custom validation message';
      const response = createValidationErrorResponse(fieldErrors, customMessage);

      return response.json().then(body => {
        expect(body.error).toBe(customMessage);
        expect(body.details.validation_errors).toEqual(fieldErrors);
      });
    });

    test('should handle array of error messages per field', () => {
      const fieldErrors = {
        password: ['Too short', 'Must contain uppercase', 'Must contain numbers'],
        email: ['Invalid format'],
        username: ['Already taken', 'Invalid characters']
      };

      const response = createValidationErrorResponse(fieldErrors);

      return response.json().then(body => {
        expect(body.details.validation_errors).toEqual(fieldErrors);
      });
    });
  });

  describe('response consistency', () => {
    test('should have consistent structure across all response types', async () => {
      const successResponse = createSuccessResponse({ data: 'test' });
      const errorResponse = createErrorResponse('Test error');
      const validationResponse = createValidationErrorResponse({ field: 'error' });

      const successBody = await successResponse.json();
      const errorBody = await errorResponse.json();
      const validationBody = await validationResponse.json();

      // All responses should have these fields
      [successBody, errorBody, validationBody].forEach(body => {
        expect(body).toHaveProperty('success');
        expect(body).toHaveProperty('timestamp');
        expect(typeof body.success).toBe('boolean');
        expect(typeof body.timestamp).toBe('string');
      });

      // Success response structure
      expect(successBody.success).toBe(true);
      expect(successBody).toHaveProperty('data');
      expect(successBody).not.toHaveProperty('error');

      // Error response structure
      expect(errorBody.success).toBe(false);
      expect(errorBody).toHaveProperty('error');
      expect(errorBody).not.toHaveProperty('data');

      // Validation error response structure
      expect(validationBody.success).toBe(false);
      expect(validationBody).toHaveProperty('error');
      expect(validationBody).toHaveProperty('details');
      expect(validationBody).not.toHaveProperty('data');
    });

    test('should have proper Content-Type headers', () => {
      const responses = [
        createSuccessResponse({ test: true }),
        createErrorResponse('Test error'),
        createValidationErrorResponse({ field: 'error' })
      ];

      responses.forEach(response => {
        expect(response.headers.get('Content-Type')).toBe('application/json');
      });
    });

    test('should produce valid JSON', async () => {
      const responses = [
        createSuccessResponse({ complex: { nested: [1, 2, 3], bool: true } }),
        createErrorResponse('Test error', 500, { code: 'SERVER_ERROR' }),
        createValidationErrorResponse({ 
          email: 'Invalid',
          nested: { field: 'Error' }
        })
      ];

      // All should parse as valid JSON without throwing
      const bodies = await Promise.all(responses.map(r => r.json()));
      
      bodies.forEach(body => {
        expect(typeof body).toBe('object');
        expect(body).not.toBeNull();
        // Should be able to stringify back to JSON
        expect(() => JSON.stringify(body)).not.toThrow();
      });
    });
  });

  describe('edge cases', () => {
    test('should handle circular references in data', () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;

      // Should throw due to circular reference (this is expected behavior)
      expect(() => createSuccessResponse(circularData)).toThrow('circular structure');
    });

    test('should handle very large data objects', () => {
      const largeData = {
        items: new Array(10000).fill(0).map((_, i) => ({
          id: i,
          data: `item-${i}`,
          nested: { value: i * 2 }
        }))
      };

      expect(() => createSuccessResponse(largeData)).not.toThrow();
    });

    test('should handle special characters in error messages', () => {
      const specialChars = 'Error with émojis 🚀 and "quotes" and \n newlines';
      const response = createErrorResponse(specialChars);

      return response.json().then(body => {
        expect(body.error).toBe(specialChars);
      });
    });

    test('should handle non-string values in validation errors', () => {
      const mixedErrors: any = {
        stringError: 'String error message',
        numberError: 123,
        booleanError: false,
        objectError: { message: 'Object error' },
        arrayError: ['Multiple', 'errors']
      };

      const response = createValidationErrorResponse(mixedErrors);

      return response.json().then(body => {
        expect(body.details.validation_errors).toEqual(mixedErrors);
      });
    });
  });
});