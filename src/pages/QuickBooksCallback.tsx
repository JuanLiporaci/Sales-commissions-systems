import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { quickBooksService } from '../services/quickbooks.js';

const QuickBooksCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const realmId = searchParams.get('realmId');
        const error = searchParams.get('error');

        if (error) {
          setError(`Error de autorización: ${error}`);
          setStatus('error');
          return;
        }

        if (!code || !realmId) {
          setError('Parámetros de autorización faltantes');
          setStatus('error');
          return;
        }

        // Handle the OAuth callback
        await quickBooksService.handleCallback(code, realmId);
        setStatus('success');

        // Redirect to configuration page after a short delay
        setTimeout(() => {
          navigate('/configuracion');
        }, 2000);

      } catch (err) {
        console.error('Error handling QuickBooks callback:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Conectando con QuickBooks...
              </h2>
              <p className="text-gray-600">
                Procesando la autorización de tu cuenta de QuickBooks.
              </p>
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
                ¡Conexión exitosa!
              </h2>
              <p className="text-gray-600 mb-4">
                Tu cuenta de QuickBooks ha sido conectada correctamente.
              </p>
              <p className="text-sm text-gray-500">
                Redirigiendo a la página de configuración...
              </p>
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
                Error de conexión
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'Ocurrió un error al conectar con QuickBooks.'}
              </p>
              <button
                onClick={() => navigate('/configuracion')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Volver a Configuración
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickBooksCallback; 