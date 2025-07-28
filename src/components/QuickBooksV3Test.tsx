import React, { useState, useEffect } from 'react';
import { quickBooksService } from '../services/quickbooks';

const QuickBooksV3Test: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Desconectado');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = () => {
    const isConnected = quickBooksService.isAuthenticated();
    setConnectionStatus(isConnected ? 'Conectado' : 'Desconectado');
    
    if (isConnected) {
      const token = localStorage.getItem('qb_access_token');
      const realmId = localStorage.getItem('qb_realm_id');
      setDebugInfo({
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
        realmId: realmId || 'No realmId',
        isAuthenticated: true
      });
    }
  };

  const testDirectAuth = async () => {
    setStatus('Iniciando autenticación directa...');
    setError('');
    
    try {
      // Test the new OAuth flow
      quickBooksService.startAuth();
      setStatus('Redirigiendo a QuickBooks para autorización...');
    } catch (err) {
      setError(`Error: ${err}`);
      setStatus('Error');
    }
  };

  const testAlternativeAuth = async () => {
    setStatus('Probando método alternativo...');
    setError('');
    
    try {
      // Alternative OAuth URL
      const authUrl = `https://appcenter.intuit.com/connect/oauth2?` +
        `client_id=ABeUukPao9RA1rdByKMtbow5HSWo0L9LAyJm6H20tqHgQvX10q&` +
        `response_type=code&` +
        `scope=com.intuit.quickbooks.accounting&` +
        `redirect_uri=${encodeURIComponent('https://sales-commissions-systems.vercel.app/callback')}&` +
        `state=alt_test_${Date.now()}`;

      console.log('🔗 URL alternativa:', authUrl);
      window.open(authUrl, '_blank');
      
      setStatus('Abriendo ventana de autorización alternativa...');
    } catch (err) {
      setError(`Error: ${err}`);
      setStatus('Error');
    }
  };

  const testOAuthPlayground = () => {
    setStatus('Abriendo OAuth Playground...');
    setError('');
    
    // Open QuickBooks OAuth Playground
    window.open('https://developer.intuit.com/v2/OAuth2Playground/', '_blank');
    setStatus('OAuth Playground abierto en nueva ventana');
  };

  const testManualAuth = () => {
    setStatus('Configurando autenticación manual...');
    setError('');
    
    // Manual OAuth URL with different parameters
    const authUrl = `https://appcenter.intuit.com/connect/oauth2?` +
      `client_id=ABeUukPao9RA1rdByKMtbow5HSWo0L9LAyJm6H20tqHgQvX10q&` +
      `response_type=code&` +
      `scope=com.intuit.quickbooks.accounting&` +
      `redirect_uri=${encodeURIComponent('https://sales-commissions-systems.vercel.app/callback')}&` +
      `state=manual_${Date.now()}`;

    console.log('🔗 URL manual:', authUrl);
    
    // Show the URL for manual testing
    setDebugInfo({
      manualAuthUrl: authUrl,
      instructions: 'Copia esta URL y pégala en tu navegador para probar manualmente'
    });
    
    setStatus('URL de autenticación manual generada');
  };

  const clearTokens = () => {
    localStorage.removeItem('qb_access_token');
    localStorage.removeItem('qb_refresh_token');
    localStorage.removeItem('qb_token_expiry');
    localStorage.removeItem('qb_realm_id');
    sessionStorage.removeItem('qb_oauth_state');
    
    setStatus('Tokens eliminados');
    setDebugInfo(null);
    setConnectionStatus('Desconectado');
  };

  const checkTokens = () => {
    const token = localStorage.getItem('qb_access_token');
    const refreshToken = localStorage.getItem('qb_refresh_token');
    const expiry = localStorage.getItem('qb_token_expiry');
    const realmId = localStorage.getItem('qb_realm_id');
    const state = sessionStorage.getItem('qb_oauth_state');
    
    setDebugInfo({
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      hasExpiry: !!expiry,
      hasRealmId: !!realmId,
      hasState: !!state,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
      expiry: expiry ? new Date(parseInt(expiry)).toLocaleString() : 'No expiry',
      realmId: realmId || 'No realmId',
      state: state || 'No state'
    });
    
    setStatus('Tokens verificados');
    checkConnectionStatus();
  };

  const testAPIEndpoint = async () => {
    setStatus('Probando endpoint de la API...');
    setError('');
    
    try {
      // Test if we can make a simple API call
      if (!quickBooksService.isAuthenticated()) {
        throw new Error('No autenticado. Primero debe conectar con QuickBooks.');
      }
      
      // Try to get company info
      const response = await quickBooksService.makeRequest('/companyinfo/1');
      setDebugInfo({
        apiTest: 'Success',
        companyInfo: response
      });
      setStatus('API endpoint funcionando correctamente');
      
    } catch (err) {
      setError(`Error en API: ${err}`);
      setStatus('Error en API');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">QuickBooks API v3 Test</h1>
      
      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Estado de Conexión</h2>
            <p className={`text-lg font-medium ${connectionStatus === 'Conectado' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus}
            </p>
          </div>
          <button
            onClick={checkConnectionStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Actualizar Estado
          </button>
        </div>
      </div>
      
      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testDirectAuth}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔗 Autenticación Directa
        </button>
        
        <button
          onClick={testAlternativeAuth}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          🔄 Método Alternativo
        </button>
        
        <button
          onClick={testManualAuth}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          🛠️ Autenticación Manual
        </button>
        
        <button
          onClick={testOAuthPlayground}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          🎮 OAuth Playground
        </button>
        
        <button
          onClick={checkTokens}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          🔍 Verificar Tokens
        </button>
        
        <button
          onClick={testAPIEndpoint}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          🧪 Probar API
        </button>
        
        <button
          onClick={clearTokens}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          🗑️ Limpiar Tokens
        </button>
      </div>

      {/* Status Messages */}
      {status && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <strong>Estado:</strong> {status}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Debug Information */}
      {debugInfo && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-bold mb-2">Información de Debug:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold mb-2">📋 Instrucciones de Prueba:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>Autenticación Directa:</strong> Usa el método principal de la aplicación</li>
          <li><strong>Método Alternativo:</strong> Prueba una URL alternativa si la primera falla</li>
          <li><strong>Autenticación Manual:</strong> Copia la URL y pégala en tu navegador</li>
          <li><strong>OAuth Playground:</strong> Herramienta oficial de QuickBooks para pruebas</li>
          <li><strong>Verificar Tokens:</strong> Revisa si los tokens están almacenados correctamente</li>
          <li><strong>Probar API:</strong> Verifica que la API funciona una vez conectado</li>
          <li><strong>Limpiar Tokens:</strong> Elimina todos los tokens para empezar de nuevo</li>
        </ol>
      </div>

      {/* Troubleshooting */}
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-bold mb-2">🔧 Solución de Problemas:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Si obtienes error 404, la aplicación puede no estar completamente configurada en el Developer Portal</li>
          <li>Verifica que el Redirect URI esté configurado como: <code>https://sales-commissions-systems.vercel.app/callback</code></li>
          <li>Asegúrate de que la aplicación esté en modo "Production" en el Developer Portal</li>
          <li>Si persisten los errores, usa el OAuth Playground para pruebas manuales</li>
        </ul>
      </div>
    </div>
  );
};

export default QuickBooksV3Test; 