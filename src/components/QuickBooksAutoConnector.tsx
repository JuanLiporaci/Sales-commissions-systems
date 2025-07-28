import React, { useState, useEffect } from 'react';
import { quickBooksService } from '../services/quickbooks.js';

const QuickBooksAutoConnector: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [error, setError] = useState('');

  useEffect(() => {
    initializeQuickBooks();
  }, []);

  const initializeQuickBooks = async () => {
    try {
      console.log('🚀 Iniciando conexión automática con QuickBooks...');
      setConnectionStatus('Inicializando QuickBooks...');
      
      // Verificar si ya está conectado
      if (quickBooksService.isAuthenticated()) {
        console.log('✅ QuickBooks ya está conectado');
        setIsConnected(true);
        setConnectionStatus('Conectado');
        setIsLoading(false);
        return;
      }

      // Intentar auto-conectar
      setConnectionStatus('Intentando auto-conectar...');
      await quickBooksService.autoConnect();
      
      // Verificar si la auto-conexión funcionó
      if (quickBooksService.isAuthenticated()) {
        console.log('✅ QuickBooks auto-conectado exitosamente');
        setIsConnected(true);
        setConnectionStatus('Auto-conectado');
      } else {
        console.log('ℹ️ QuickBooks requiere conexión manual');
        setConnectionStatus('Requiere autorización');
      }
    } catch (error) {
      console.error('❌ Error inicializando QuickBooks:', error);
      setError('Error de conexión: ' + error.message);
      setConnectionStatus('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualConnect = () => {
    try {
      setConnectionStatus('Redirigiendo a QuickBooks...');
      quickBooksService.startAuth();
    } catch (error) {
      setError('Error al iniciar la conexión: ' + error.message);
      setConnectionStatus('Error');
    }
  };

  const handleDisconnect = () => {
    quickBooksService.logout();
    setIsConnected(false);
    setConnectionStatus('Desconectado');
    setError('');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError('');
    initializeQuickBooks();
  };

  // Solo mostrar si hay algún estado especial
  if (isLoading || !isConnected || error) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${
              isLoading ? 'bg-yellow-400 animate-pulse' :
              isConnected ? 'bg-green-400' :
              error ? 'bg-red-400' : 'bg-gray-400'
            }`}></div>
            <h3 className="font-semibold text-gray-800">QuickBooks</h3>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            {isLoading ? 'Conectando...' : connectionStatus}
          </div>
          
          {error && (
            <div className="text-xs text-red-600 mb-3">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            {!isConnected && !isLoading && (
              <button
                onClick={handleManualConnect}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Conectar
              </button>
            )}
            
            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                Desconectar
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si está conectado y no hay errores, no mostrar nada
  return null;
};

export default QuickBooksAutoConnector; 