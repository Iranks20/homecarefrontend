import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (event) => {
        setError('WebSocket connection error');
        onError?.(event);
      };
    } catch (err) {
      setError('Failed to create WebSocket connection');
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect,
  };
}

export function useNotificationsWebSocket() {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'notification') {
      setNotifications(prev => [message, ...prev]);
    }
  }, []);

  const { isConnected, sendMessage, connect, disconnect } = useWebSocket({
    url:
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.MODE === 'production' ? 'ws://3.89.141.154:3007/ws/notifications' : 'ws://localhost:3001/ws/notifications'),
    onMessage: handleMessage,
  });

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    sendMessage,
    connect,
    disconnect,
    clearNotifications,
  };
}

export function useRealtimeUpdates(entityType: string, entityId?: string) {
  const [updates, setUpdates] = useState<WebSocketMessage[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'update' && 
        message.data.entityType === entityType &&
        (!entityId || message.data.entityId === entityId)) {
      setUpdates(prev => [message, ...prev]);
    }
  }, [entityType, entityId]);

  const { isConnected, sendMessage } = useWebSocket({
    url:
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.MODE === 'production' ? 'ws://3.89.141.154:3007/ws/updates' : 'ws://localhost:3001/ws/updates'),
    onMessage: handleMessage,
  });

  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  return {
    updates,
    isConnected,
    sendMessage,
    clearUpdates,
  };
}
