import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { quickBooksService } from '../services/quickbooks.js';

const QuickBooksCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Procesando callback de QuickBooks...');
        
        // Obtener parámetros de la URL
        const code = searchParams.get('code');
        const realmId = searchParams.get('realmId');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        // Información de debug
        const debugData = {
          code: code ? 'Presente' : 'Ausente',
          realmId: realmId ? 'Presente' : 'Ausente',
          error: error || 'Ninguno',
          state: state || 'Ninguno',
          url: window.location.href
        };
        
        setDebugInfo(JSON.stringify(debugData, null, 2));
        console.log('📋 Parámetros recibidos:', debugData);

        if (error) {
          console.error('❌ Error de autorización:', error);
          setError(`Error de autorización: ${error}`);
          setStatus('error');
          return;
        }

        if (!code || !realmId) {
          console.error('❌ Parámetros faltantes:', { code: !!code, realmId: !!realmId });
          setError('Parámetros de autorización faltantes. Asegúrate de que la URL de redirección esté configurada correctamente en QuickBooks.');
          setStatus('error');
          return;
        }

        console.log('✅ Parámetros válidos, procesando autorización...');
        
        // Manejar el callback de OAuth
        await quickBooksService.handleCallback(code, realmId);
        
        console.log('✅ Autorización completada exitosamente');
        setStatus('success');

        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
          console.log('🔄 Redirigiendo al dashboard...');
          navigate('/');
        }, 3000);

      } catch (err) {
        console.error('❌ Error procesando callback:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al procesar la autorización');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Conectando con QuickBooks...
              </h2>
              <p className="text-gray-600 mb-4">
                Procesando la autorización de tu cuenta de QuickBooks.
              </p>
              <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded">
                <strong>Debug Info:</strong>
                <pre className="text-left mt-2 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Conexión exitosa! 🎉
              </h2>
              <p className="text-gray-600 mb-4">
                Tu cuenta de QuickBooks ha sido conectada correctamente.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Redirigiendo al dashboard en unos segundos...
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Ir al Dashboard
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error de conexión ❌
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'Ocurrió un error al conectar con QuickBooks.'}
              </p>
              
              <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded mb-4">
                <strong>Debug Info:</strong>
                <pre className="text-left mt-2 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors mr-2"
                >
                  Ir al Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Intentar de nuevo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickBooksCallback; 