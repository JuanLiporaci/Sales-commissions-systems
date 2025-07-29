import React, { useState, useEffect } from 'react';
import { quickBooksService } from '../services/quickbooks.js';

const QuickBooksDataDisplay: React.FC = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    console.log('🔄 QuickBooksDataDisplay: useEffect ejecutado');
    checkConnectionAndLoadData();
  }, []);

  const checkConnectionAndLoadData = async () => {
    console.log('🔍 Verificando conexión de QuickBooks...');
    const connected = quickBooksService.isAuthenticated();
    console.log('🔗 Estado de conexión:', connected);
    setIsConnected(connected);
    
    if (connected) {
      console.log('✅ Conectado, cargando datos automáticamente...');
      await loadQuickBooksData();
    } else {
      console.log('❌ No conectado, esperando conexión...');
    }
  };

  const loadQuickBooksData = async () => {
    setIsLoading(true);
    setError('');
    setDebugInfo(null);
    
    try {
      console.log('🔄 Cargando datos de QuickBooks...');
      
      // Verificar tokens
      const token = localStorage.getItem('qb_access_token');
      const realmId = localStorage.getItem('qb_realm_id');
      
      console.log('🔑 Token presente:', !!token);
      console.log('🏢 Realm ID:', realmId);
      
      // Cargar clientes y productos en paralelo
      const [customersData, productsData] = await Promise.all([
        quickBooksService.getCustomers().catch(err => {
          console.error('❌ Error cargando clientes:', err);
          return [];
        }),
        quickBooksService.getProducts().catch(err => {
          console.error('❌ Error cargando productos:', err);
          return [];
        })
      ]);
      
      console.log('📊 Datos recibidos:', {
        customers: customersData.length,
        products: productsData.length,
        customersData: customersData.slice(0, 2), // Primeros 2 para debug
        productsData: productsData.slice(0, 2)    // Primeros 2 para debug
      });
      
      setCustomers(customersData);
      setProducts(productsData);
      
      // Guardar info de debug
      setDebugInfo({
        tokenPresent: !!token,
        realmId: realmId,
        customersCount: customersData.length,
        productsCount: productsData.length,
        lastUpdated: new Date().toLocaleString()
      });
      
      console.log('✅ Datos de QuickBooks cargados exitosamente');
      
    } catch (error) {
      console.error('❌ Error cargando datos de QuickBooks:', error);
      setError('Error cargando datos: ' + error.message);
      setDebugInfo({
        error: error.message,
        lastUpdated: new Date().toLocaleString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Refrescando datos manualmente...');
    if (isConnected) {
      loadQuickBooksData();
    }
  };

  const handleImportCustomers = async () => {
    try {
      console.log('📍 Importando clientes como ubicaciones...');
      const locations = await quickBooksService.importCustomersAsLocations();
      console.log('✅ Clientes importados:', locations.length);
      alert(`✅ ${locations.length} clientes importados como ubicaciones`);
    } catch (error) {
      console.error('❌ Error importando clientes:', error);
      alert('❌ Error importando clientes: ' + error.message);
    }
  };

  const handleImportProducts = async () => {
    try {
      console.log('📦 Importando productos...');
      const importedProducts = await quickBooksService.importProducts();
      console.log('✅ Productos importados:', importedProducts.length);
      alert(`✅ ${importedProducts.length} productos importados`);
    } catch (error) {
      console.error('❌ Error importando productos:', error);
      alert('❌ Error importando productos: ' + error.message);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          <h3 className="font-semibold text-blue-800">QuickBooks</h3>
        </div>
        <p className="text-blue-700 text-sm">
          No conectado. Los datos se cargarán automáticamente cuando se conecte.
        </p>
        <button
          onClick={checkConnectionAndLoadData}
          className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          🔄 Verificar Conexión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <h3 className="font-semibold text-green-800">QuickBooks Conectado</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? '⏳ Cargando...' : '🔄 Actualizar'}
          </button>
        </div>
        <p className="text-green-700 text-sm mt-1">
          Datos sincronizados automáticamente desde QuickBooks
        </p>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">🔍 Información de Debug</h4>
          <div className="text-sm text-gray-600">
            <div>Token presente: {debugInfo.tokenPresent ? '✅' : '❌'}</div>
            <div>Realm ID: {debugInfo.realmId || 'No disponible'}</div>
            <div>Clientes: {debugInfo.customersCount || 0}</div>
            <div>Productos: {debugInfo.productsCount || 0}</div>
            <div>Última actualización: {debugInfo.lastUpdated}</div>
            {debugInfo.error && <div className="text-red-600">Error: {debugInfo.error}</div>}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">❌ Error</h4>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Datos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clientes */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              👥 Clientes de QuickBooks
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {customers.length}
              </span>
            </h4>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center text-gray-500">⏳ Cargando clientes...</div>
            ) : customers.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {customers.slice(0, 5).map((customer, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-800">
                      {customer.DisplayName || `Cliente ${index + 1}`}
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
                  </div>
                ))}
                {customers.length > 5 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... y {customers.length - 5} más
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No hay clientes disponibles
                <br />
                <small className="text-xs">Verifica que tengas clientes en QuickBooks</small>
              </div>
            )}
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              📦 Productos de QuickBooks
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {products.length}
              </span>
            </h4>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center text-gray-500">⏳ Cargando productos...</div>
            ) : products.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {products.slice(0, 5).map((product, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-800">
                      {product.Name || `Producto ${index + 1}`}
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
                {products.length > 5 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... y {products.length - 5} más
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No hay productos disponibles
                <br />
                <small className="text-xs">Verifica que tengas productos en QuickBooks</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">⚡ Acciones Rápidas</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleImportCustomers}
            className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
          >
            📍 Importar Clientes como Ubicaciones
          </button>
          <button
            onClick={handleImportProducts}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
          >
            📦 Importar Productos
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickBooksDataDisplay; 