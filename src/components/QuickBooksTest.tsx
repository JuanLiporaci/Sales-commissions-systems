import React, { useState, useEffect } from 'react';
import { quickBooksService } from '../services/quickbooks.js';

const QuickBooksTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    const connected = quickBooksService.isAuthenticated();
    setIsConnected(connected);
    setConnectionStatus(connected ? '✅ Conectado' : '❌ No conectado');
  };

  const handleConnect = () => {
    try {
      quickBooksService.startAuth();
    } catch (error) {
      setError('Error al iniciar la conexión: ' + error.message);
    }
  };

  const handleDisconnect = () => {
    quickBooksService.logout();
    setIsConnected(false);
    setConnectionStatus('❌ Desconectado');
    setCustomers([]);
    setProducts([]);
    setError('');
  };

  const handleTestCustomers = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔍 Probando conexión con QuickBooks...');
      const customersData = await quickBooksService.getCustomers();
      console.log('✅ Clientes obtenidos:', customersData);
      setCustomers(customersData);
      setConnectionStatus('✅ Conectado - Datos recibidos');
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      setError('Error obteniendo clientes: ' + error.message);
      setConnectionStatus('❌ Error en conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestProducts = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔍 Probando productos de QuickBooks...');
      const productsData = await quickBooksService.getProducts();
      console.log('✅ Productos obtenidos:', productsData);
      setProducts(productsData);
      setConnectionStatus('✅ Conectado - Datos recibidos');
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      setError('Error obteniendo productos: ' + error.message);
      setConnectionStatus('❌ Error en conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCustomers = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔍 Importando clientes como ubicaciones...');
      const locationsData = await quickBooksService.importCustomersAsLocations();
      console.log('✅ Ubicaciones importadas:', locationsData);
      setCustomers(locationsData);
      setConnectionStatus('✅ Clientes importados como ubicaciones');
    } catch (error) {
      console.error('❌ Error importando clientes:', error);
      setError('Error importando clientes: ' + error.message);
      setConnectionStatus('❌ Error en importación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Pruebas de QuickBooks - Producción
      </h2>

      {/* Estado de conexión */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Estado de Conexión</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Estado:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            connectionStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mb-6 space-y-3">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            🔗 Conectar con QuickBooks
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleTestCustomers}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? '⏳ Cargando...' : '👥 Obtener Clientes'}
            </button>
            
            <button
              onClick={handleTestProducts}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? '⏳ Cargando...' : '📦 Obtener Productos'}
            </button>
            
            <button
              onClick={handleImportCustomers}
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? '⏳ Cargando...' : '📍 Importar Clientes como Ubicaciones'}
            </button>
            
            <button
              onClick={handleDisconnect}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🚪 Desconectar
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Resultados */}
      {customers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            👥 Clientes ({customers.length})
          </h3>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-3">
              {customers.slice(0, 10).map((customer, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="font-medium text-gray-800">
                    {customer.DisplayName || customer.name || `Cliente ${index + 1}`}
                  </div>
                  {customer.PrimaryEmailAddr && (
                    <div className="text-sm text-gray-600">
                      📧 {customer.PrimaryEmailAddr.Address}
                    </div>
                  )}
                  {customer.PrimaryPhone && (
                    <div className="text-sm text-gray-600">
                      📞 {customer.PrimaryPhone.FreeFormNumber}
                    </div>
                  )}
                  {customer.address && (
                    <div className="text-sm text-gray-600">
                      📍 {customer.address}
                    </div>
                  )}
                </div>
              ))}
              {customers.length > 10 && (
                <div className="text-center text-gray-500 text-sm">
                  ... y {customers.length - 10} más
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            📦 Productos ({products.length})
          </h3>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-3">
              {products.slice(0, 10).map((product, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="font-medium text-gray-800">
                    {product.Name || product.name || `Producto ${index + 1}`}
                  </div>
                  {product.Description && (
                    <div className="text-sm text-gray-600">
                      📝 {product.Description}
                    </div>
                  )}
                  {product.UnitPrice && (
                    <div className="text-sm text-green-600 font-medium">
                      💰 ${product.UnitPrice}
                    </div>
                  )}
                  {product.Sku && (
                    <div className="text-sm text-gray-600">
                      🏷️ SKU: {product.Sku}
                    </div>
                  )}
                </div>
              ))}
              {products.length > 10 && (
                <div className="text-center text-gray-500 text-sm">
                  ... y {products.length - 10} más
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Información de debug */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">🔧 Información de Debug</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Client ID: {quickBooksService._token ? '✅ Configurado' : '❌ No configurado'}</div>
          <div>• Token: {quickBooksService._token ? '✅ Presente' : '❌ Ausente'}</div>
          <div>• Realm ID: {quickBooksService._realmId || '❌ No configurado'}</div>
          <div>• Token Expiry: {quickBooksService._tokenExpiry ? new Date(quickBooksService._tokenExpiry).toLocaleString() : '❌ No configurado'}</div>
        </div>
      </div>
    </div>
  );
};

export default QuickBooksTest; 