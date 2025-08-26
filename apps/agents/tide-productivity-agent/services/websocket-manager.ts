/**
 * WebSocket Manager Service - Handles real-time communication
 */

import type { WebSocketMessage, SmartNotification, UserSession } from '../types';

export class WebSocketManager {
  private connectedClients = new Set<WebSocket>();
  private userSessions = new Map<WebSocket, UserSession>();

  /**
   * Handle new WebSocket connection
   */
  handleConnection(webSocket: WebSocket): void {
    webSocket.accept();
    this.connectedClients.add(webSocket);

    // Send welcome message
    this.sendMessage(webSocket, {
      type: 'welcome',
      timestamp: new Date().toISOString(),
      connectedClients: this.connectedClients.size
    });

    // Set up event listeners
    this.setupEventListeners(webSocket);
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(webSocket: WebSocket): void {
    webSocket.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string) as WebSocketMessage;
        await this.handleMessage(webSocket, data);
      } catch (error) {
        console.error('[WebSocketManager] Message parsing error:', error);
        this.sendError(webSocket, 'Invalid message format');
      }
    });

    webSocket.addEventListener('close', () => {
      this.handleDisconnection(webSocket);
    });

    webSocket.addEventListener('error', (event) => {
      console.error('[WebSocketManager] WebSocket error:', event);
      this.handleDisconnection(webSocket);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleMessage(webSocket: WebSocket, message: WebSocketMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'authenticate':
          await this.handleAuthentication(webSocket, message);
          break;

        case 'ping':
          this.sendMessage(webSocket, {
            type: 'pong',
            timestamp: new Date().toISOString()
          });
          break;

        default:
          console.warn(`[WebSocketManager] Unknown message type: ${message.type}`);
          this.sendError(webSocket, 'Unknown message type');
      }
    } catch (error) {
      console.error('[WebSocketManager] Error handling message:', error);
      this.sendError(webSocket, 'Error processing message');
    }
  }

  /**
   * Handle user authentication
   */
  private async handleAuthentication(webSocket: WebSocket, message: WebSocketMessage): Promise<void> {
    if (!message.userId) {
      this.sendError(webSocket, 'UserId required for authentication');
      return;
    }

    const session: UserSession = {
      userId: message.userId,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      preferences: message.preferences
    };

    this.userSessions.set(webSocket, session);

    this.sendMessage(webSocket, {
      type: 'authenticated',
      userId: message.userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle connection cleanup
   */
  private handleDisconnection(webSocket: WebSocket): void {
    const session = this.userSessions.get(webSocket);
    const userId = session?.userId || 'unknown';

    this.connectedClients.delete(webSocket);
    this.userSessions.delete(webSocket);
  }

  /**
   * Send message to specific WebSocket
   */
  private sendMessage(webSocket: WebSocket, message: WebSocketMessage): void {
    if (webSocket.readyState === WebSocket.READY_STATE_OPEN) {
      try {
        webSocket.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocketManager] Failed to send message:', error);
        this.handleDisconnection(webSocket);
      }
    }
  }

  /**
   * Send error message to WebSocket
   */
  private sendError(webSocket: WebSocket, error: string): void {
    this.sendMessage(webSocket, {
      type: 'error',
      error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast message to specific user
   */
  async broadcastToUser(userId: string, message: any): Promise<boolean> {
    let sent = false;
    const messageString = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });

    for (const [socket, session] of this.userSessions.entries()) {
      if (session.userId === userId && socket.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          socket.send(messageString);
          sent = true;
          
          // Update last activity
          session.lastActivity = new Date().toISOString();
        } catch (error) {
          console.error('[WebSocketManager] Failed to broadcast to user:', error);
          this.handleDisconnection(socket);
        }
      }
    }

    if (!sent) {
      console.warn(`[WebSocketManager] No active connections found for user ${userId}`);
    }

    return sent;
  }

  /**
   * Broadcast message to all connected clients
   */
  async broadcastToAll(message: any): Promise<number> {
    let sent = 0;
    const messageString = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });

    for (const socket of this.connectedClients) {
      if (socket.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          socket.send(messageString);
          sent++;
        } catch (error) {
          console.error('[WebSocketManager] Failed to broadcast to all:', error);
          this.handleDisconnection(socket);
        }
      }
    }

    return sent;
  }

  /**
   * Send smart notification to user
   */
  async sendSmartNotification(userId: string, notification: SmartNotification): Promise<boolean> {
    const { type, ...notificationData } = notification;
    return await this.broadcastToUser(userId, {
      type: 'notification',
      notification: notificationData
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): { connectedClients: number; authenticatedUsers: number } {
    return {
      connectedClients: this.connectedClients.size,
      authenticatedUsers: this.userSessions.size
    };
  }

  /**
   * Get user session if exists
   */
  getUserSession(userId: string): UserSession | null {
    for (const session of this.userSessions.values()) {
      if (session.userId === userId) {
        return session;
      }
    }
    return null;
  }

  /**
   * Clean up inactive connections
   */
  cleanupInactiveConnections(maxAgeMinutes: number = 30): number {
    const cutoff = Date.now() - (maxAgeMinutes * 60 * 1000);
    let cleaned = 0;

    for (const [socket, session] of this.userSessions.entries()) {
      const lastActivity = new Date(session.lastActivity).getTime();
      
      if (lastActivity < cutoff) {
        this.handleDisconnection(socket);
        socket.close();
        cleaned++;
      }
    }

    return cleaned;
  }
}