import React, { useState } from 'react';
import { quickBooksService } from '../services/quickbooks';

const QuickBooksDirectTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<any>(null);

  const testDirectAuth = async () => {
    setStatus('Probando autenticación directa...');
    setError('');
    
    try {
      // Test direct OAuth flow
      const authUrl = `https://appcenter.intuit.com/connect/oauth2?` +
        `client_id=ABeUukPao9RA1rdByKMtbow5HSWo0L9LAyJm6H20tqHgQvX10q&` +
        `response_type=code&` +
        `scope=com.intuit.quickbooks.accounting&` +
        `redirect_uri=${encodeURIComponent('https://sales-commissions-systems.vercel.app/callback')}&` +
        `state=test123`;

      console.log('🔗 URL de prueba directa:', authUrl);
      window.open(authUrl, '_blank');
      
      setStatus('Abriendo ventana de autorización...');
    } catch (err) {
      setError(`Error: ${err}`);
      setStatus('Error');
    }
  };

  const testAlternativeAuth = async () => {
    setStatus('Probando autenticación alternativa...');
    setError('');
    
    try {
      // Test alternative OAuth flow
      const authUrl = `https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl?` +
        `client_id=ABeUukPao9RA1rdByKMtbow5HSWo0L9LAyJm6H20tqHgQvX10q&` +
        `response_type=code&` +
        `scope=com.intuit.quickbooks.accounting&` +
        `redirect_uri=${encodeURIComponent('https://sales-commissions-systems.vercel.app/callback')}&` +
        `state=test456`;

      console.log('🔗 URL de prueba alternativa:', authUrl);
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

  const clearTokens = () => {
    localStorage.removeItem('qb_access_token');
    localStorage.removeItem('qb_refresh_token');
    localStorage.removeItem('qb_token_expiry');
    localStorage.removeItem('qb_realm_id');
    setStatus('Tokens eliminados');
    setData(null);
  };

  const checkTokens = () => {
    const token = localStorage.getItem('qb_access_token');
    const refreshToken = localStorage.getItem('qb_refresh_token');
    const expiry = localStorage.getItem('qb_token_expiry');
    const realmId = localStorage.getItem('qb_realm_id');
    
    setData({
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      hasExpiry: !!expiry,
      hasRealmId: !!realmId,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
      expiry: expiry ? new Date(parseInt(expiry)).toLocaleString() : 'No expiry'
    });
    
    setStatus('Tokens verificados');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">QuickBooks Direct Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testDirectAuth}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Probar Autenticación Directa
        </button>
        
        <button
          onClick={testAlternativeAuth}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Probar Autenticación Alternativa
        </button>
        
        <button
          onClick={testOAuthPlayground}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Abrir OAuth Playground
        </button>
        
        <button
          onClick={checkTokens}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Verificar Tokens
        </button>
        
        <button
          onClick={clearTokens}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Limpiar Tokens
        </button>
      </div>

      {status && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <strong>Estado:</strong> {status}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h3 className="font-bold mb-2">Información de Tokens:</h3>
          <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Haz clic en "Probar Autenticación Directa" para intentar la conexión principal</li>
          <li>Si falla, prueba "Probar Autenticación Alternativa"</li>
          <li>Si ambas fallan, usa "Abrir OAuth Playground" para pruebas manuales</li>
          <li>Usa "Verificar Tokens" para ver si la autenticación fue exitosa</li>
          <li>Usa "Limpiar Tokens" si necesitas empezar de nuevo</li>
        </ol>
      </div>
    </div>
  );
};

export default QuickBooksDirectTest; 