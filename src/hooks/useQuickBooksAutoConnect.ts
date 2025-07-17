import { useState, useEffect } from 'react';
import { quickBooksService } from '../services/quickbooks.js';

export const useQuickBooksAutoConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Check if already authenticated
        if (quickBooksService.isAuthenticated()) {
          setIsConnected(true);
          setIsConnecting(false);
          return;
        }

        // Try to auto-connect
        await quickBooksService.autoConnect();
        
        // Check if auto-connect was successful
        if (quickBooksService.isAuthenticated()) {
          setIsConnected(true);
        } else {
          setError('No se pudo conectar automáticamente con QuickBooks');
        }
      } catch (err) {
        console.error('Error in QuickBooks auto-connect:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsConnecting(false);
      }
    };

    initializeConnection();

    // Set up periodic connection check
    const interval = setInterval(() => {
      const authenticated = quickBooksService.isAuthenticated();
      if (authenticated !== isConnected) {
        setIsConnected(authenticated);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  const forceReconnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Clear any existing tokens
      quickBooksService.logout();
      
      // Try to auto-connect again
      await quickBooksService.autoConnect();
      
      if (quickBooksService.isAuthenticated()) {
        setIsConnected(true);
      } else {
        setError('No se pudo reconectar con QuickBooks');
      }
    } catch (err) {
      console.error('Error in force reconnect:', err);
      setError(err instanceof Error ? err.message : 'Error al reconectar');
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    isConnected,
    isConnecting,
    error,
    forceReconnect
  };
}; 