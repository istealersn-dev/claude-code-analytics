import type { FastifyInstance } from 'fastify';

export interface SyncProgressUpdate {
  type: 'sync_progress';
  data: {
    status: 'starting' | 'in_progress' | 'completed' | 'failed';
    progress: number; // 0-100
    currentFile?: string;
    totalFiles: number;
    processedFiles: number;
    sessionsProcessed: number;
    messagesProcessed: number;
    errors: number;
    startTime: string;
    estimatedTimeRemaining?: number; // in milliseconds
  };
}

export interface SyncStatusUpdate {
  type: 'sync_status';
  data: {
    isRunning: boolean;
    lastSync?: string;
    filesProcessed?: number;
    sessionsProcessed?: number;
    error?: string;
  };
}

export type WebSocketMessage = SyncProgressUpdate | SyncStatusUpdate;

export class WebSocketService {
  private connections: Set<any> = new Set();
  private app: FastifyInstance | null = null;

  constructor() {
    this.connections = new Set();
  }

  setApp(app: FastifyInstance) {
    this.app = app;
  }

  async register(app: FastifyInstance) {
    this.app = app;
    
    // Register WebSocket plugin
    await app.register(require('@fastify/websocket'), {
      options: {
        maxPayload: 1024 * 1024, // 1MB
      },
    });

    // WebSocket route handler
    (app as any).get('/ws/sync', { websocket: true }, (connection: any, req: any) => {
      console.log('🔌 New WebSocket connection for sync updates');
      
      this.connections.add(connection);
      
      // Send initial status
      this.sendToConnection(connection, {
        type: 'sync_status',
        data: {
          isRunning: false,
          lastSync: undefined,
          filesProcessed: 0,
          sessionsProcessed: 0,
        },
      });

      connection.socket.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.connections.delete(connection);
      });

      connection.socket.on('error', (error: any) => {
        console.error('🔌 WebSocket error:', error);
        this.connections.delete(connection);
      });
    });

    console.log('📡 WebSocket service registered with /ws/sync endpoint');
  }

  private sendToConnection(connection: any, message: WebSocketMessage) {
    try {
      if (connection.socket.readyState === 1) { // WebSocket.OPEN
        connection.socket.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  broadcast(message: WebSocketMessage) {
    console.log(`📡 Broadcasting message: ${message.type}`);
    
    const deadConnections: any[] = [];
    
    for (const connection of this.connections) {
      try {
        this.sendToConnection(connection, message);
      } catch (error) {
        console.error('Failed to broadcast to connection:', error);
        deadConnections.push(connection);
      }
    }

    // Clean up dead connections
    deadConnections.forEach(conn => this.connections.delete(conn));
  }

  sendSyncProgress(progress: SyncProgressUpdate['data']) {
    this.broadcast({
      type: 'sync_progress',
      data: progress,
    });
  }

  sendSyncStatus(status: SyncStatusUpdate['data']) {
    this.broadcast({
      type: 'sync_status',
      data: status,
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  closeAllConnections() {
    for (const connection of this.connections) {
      try {
        connection.socket.close();
      } catch (error) {
        console.error('Error closing WebSocket connection:', error);
      }
    }
    this.connections.clear();
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
