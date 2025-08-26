/**
 * Preferences Handler - Manages user preferences requests
 */

import type { PreferencesRequest, PreferencesResponse } from '../types';
import type { PreferencesStore } from '../services';

export class PreferencesHandler {
  private preferencesStore: PreferencesStore;

  constructor(preferencesStore: PreferencesStore) {
    this.preferencesStore = preferencesStore;
  }

  /**
   * Handle preferences request (GET or POST)
   */
  async handleRequest(request: Request): Promise<Response> {
    try {
      if (request.method === 'GET') {
        return this.handleGetRequest(request);
      } else if (request.method === 'POST') {
        return this.handlePostRequest(request);
      } else {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('[PreferencesHandler] Request failed:', error);
      return this.errorResponse('Failed to handle preferences request');
    }
  }

  /**
   * Handle GET request to retrieve preferences
   */
  private async handleGetRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        return this.errorResponse('Missing userId parameter', 400);
      }

      const preferences = await this.preferencesStore.getUserPreferences(userId);
      
      return this.successResponse({ 
        success: true,
        preferences 
      });

    } catch (error) {
      console.error('[PreferencesHandler] GET request failed:', error);
      return this.errorResponse('Failed to retrieve preferences');
    }
  }

  /**
   * Handle POST request to update preferences
   */
  private async handlePostRequest(request: Request): Promise<Response> {
    try {
      const body = await request.json() as PreferencesRequest;
      
      if (!body.userId) {
        return this.errorResponse('UserId is required', 400);
      }

      if (!body.preferences) {
        return this.errorResponse('Preferences are required for update', 400);
      }

      const success = await this.preferencesStore.updateUserPreferences(body.userId, body.preferences);
      
      if (!success) {
        return this.errorResponse('Failed to update preferences', 500);
      }

      // Get updated preferences to return
      const updatedPreferences = await this.preferencesStore.getUserPreferences(body.userId);

      return this.successResponse({ 
        success: true,
        preferences: updatedPreferences
      });

    } catch (error) {
      console.error('[PreferencesHandler] POST request failed:', error);
      return this.errorResponse('Failed to update preferences');
    }
  }

  /**
   * Create success response
   */
  private successResponse(data: any): Response {
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Create error response
   */
  private errorResponse(message: string, status: number = 500): Response {
    return new Response(JSON.stringify({ 
      success: false,
      error: message 
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}