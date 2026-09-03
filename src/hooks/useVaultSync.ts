import { useEffect, useState } from 'react';

export function useVaultSync(onVaultUpdate?: () => void) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Connect directly to backend WebSocket on port 4000
    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:4000`;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          setLastSyncTime(new Date());
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === 'vault:updated' ||
              data.type === 'note:saved' ||
              data.type === 'note:deleted' ||
              data.type === 'daily:created'
            ) {
              setLastSyncTime(new Date());
              if (onVaultUpdate) {
                onVaultUpdate();
              }
            }
          } catch (e) {
            console.error('[WS] Parse error:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [onVaultUpdate]);

  return { isConnected, lastSyncTime };
}
