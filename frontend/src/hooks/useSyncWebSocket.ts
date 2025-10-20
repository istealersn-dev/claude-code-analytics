import { useEffect, useState, useCallback } from 'react';
import { getApiUrl } from '../config/environment';

export interface SyncProgressData {
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
}

export interface SyncStatusData {
  isRunning: boolean;
  lastSync?: string;
  filesProcessed?: number;
  sessionsProcessed?: number;
  error?: string;
}

export interface WebSocketMessage {
  type: 'sync_progress' | 'sync_status';
  data: SyncProgressData | SyncStatusData;
}

export function useSyncWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    try {
      // Convert HTTP URL to WebSocket URL
      const apiUrl = getApiUrl('/ws/sync');
      const wsUrl = apiUrl.replace(/^https?:\/\//, (match) => 
        match === 'https://' ? 'wss://' : 'ws://'
      );
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🔌 WebSocket connected for sync updates');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'sync_progress':
              setSyncProgress(message.data as SyncProgressData);
              break;
            case 'sync_status':
              setSyncStatus(message.data as SyncStatusData);
              break;
            default:
              console.warn('Unknown WebSocket message type:', message.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          setError('Failed to parse server message');
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after a delay if not a clean close
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect WebSocket...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('🔌 WebSocket error:', err);
        setError('WebSocket connection failed');
        setIsConnected(false);
      };

      return ws;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setSyncProgress(null);
    setSyncStatus(null);
  }, []);

  useEffect(() => {
    const ws = connect();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    syncProgress,
    syncStatus,
    error,
    connect,
    disconnect,
  };
}
