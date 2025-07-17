import React, { useState, useEffect } from 'react';
import { quickBooksService } from '../services/quickbooks.js';

const QuickBooksAuth: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status on component mount
    setIsAuthenticated(quickBooksService.isAuthenticated());
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const realmId = urlParams.get('realmId');
    
    if (code && realmId) {
      handleOAuthCallback(code, realmId);
    }
  }, []);

  const handleOAuthCallback = async (code: string, realmId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await quickBooksService.handleCallback(code, realmId);
      setIsAuthenticated(true);
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la autenticación');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      quickBooksService.startAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar la autenticación');
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    quickBooksService.logout();
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Conexión con QuickBooks
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">
            {isAuthenticated ? 'Conectado a QuickBooks' : 'No conectado'}
          </span>
        </div>
        
        {isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              La aplicación está conectada a QuickBooks y puede sincronizar datos.
            </p>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Conecta tu cuenta de QuickBooks para sincronizar clientes, productos y precios.
            </p>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Conectando...' : 'Conectar con QuickBooks'}
            </button>
          </div>
        )}
      </div>
      
      {isAuthenticated && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Acciones disponibles:
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Sincronizar clientes y direcciones</p>
            <p>• Sincronizar productos y precios</p>
            <p>• Obtener información actualizada automáticamente</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickBooksAuth; 