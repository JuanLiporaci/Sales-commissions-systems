import React, { useState, useEffect } from 'react';
import { quickBooksService } from '../services/quickbooks.js';

interface QuickBooksData {
  customers: any[];
  products: any[];
  isLoading: boolean;
  error: string | null;
}

interface Customer {
  Id: string;
  Name?: string;
  DisplayName?: string;
  FullyQualifiedName?: string;
  CompanyName?: string;
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  PrimaryEmailAddr?: {
    Address?: string;
  };
  PrimaryPhone?: {
    FreeFormNumber?: string;
  };
}

interface Product {
  Id: string;
  Name: string;
  Description?: string;
  UnitPrice?: number;
  PurchaseCost?: number;
  Type: string;
  Active: boolean;
  Sku?: string;
  QtyOnHand?: number;
}

const QuickBooksDataDisplay: React.FC = () => {
  const [data, setData] = useState<QuickBooksData>({
    customers: [],
    products: [],
    isLoading: false,
    error: null
  });

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    realmId: null,
    hasToken: false
  });

  useEffect(() => {
    checkConnection();
    if (quickBooksService.isAuthenticated()) {
      loadData();
    }
  }, []);

  const checkConnection = () => {
    const isConnected = quickBooksService.isAuthenticated();
    const realmId = quickBooksService._realmId;
    const hasToken = !!quickBooksService._token;
    
    setConnectionStatus({
      isConnected,
      realmId,
      hasToken
    });
  };

  const loadData = async () => {
    if (!quickBooksService.isAuthenticated()) {
      setData(prev => ({
        ...prev,
        error: 'QuickBooks no está conectado. Por favor autoriza la conexión.'
      }));
      return;
    }

    setData(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      console.log('🔄 Cargando datos de QuickBooks...');
      
      // Cargar clientes y productos en paralelo
      const [customers, products] = await Promise.all([
        quickBooksService.getCustomers().catch(err => {
          console.error('Error loading customers:', err);
          return [];
        }),
        quickBooksService.getProducts().catch(err => {
          console.error('Error loading products:', err);
          return [];
        })
      ]);

      setData({
        customers,
        products,
        isLoading: false,
        error: null
      });

      console.log('✅ Datos cargados:', { 
        customersCount: customers.length, 
        productsCount: products.length 
      });

    } catch (error: any) {
      console.error('❌ Error loading QuickBooks data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error desconocido al cargar datos'
      }));
    }
  };

  const handleConnect = () => {
    try {
      quickBooksService.startAuth();
    } catch (error: any) {
      setData(prev => ({
        ...prev,
        error: error.message || 'Error al iniciar conexión'
      }));
    }
  };

  const handleRefresh = () => {
    checkConnection();
    loadData();
  };

  const handleDisconnect = () => {
    quickBooksService.logout();
    setConnectionStatus({
      isConnected: false,
      realmId: null,
      hasToken: false
    });
    setData({
      customers: [],
      products: [],
      isLoading: false,
      error: null
    });
  };

  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Estado de QuickBooks</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {connectionStatus.isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus.hasToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {connectionStatus.hasToken ? 'Token válido' : 'Sin token'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus.realmId ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {connectionStatus.realmId ? `Empresa: ${connectionStatus.realmId}` : 'Sin empresa'}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          {!connectionStatus.isConnected ? (
            <button
              onClick={handleConnect}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Conectar QuickBooks
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Desconectar
            </button>
          )}
          
          <button
            onClick={handleRefresh}
            disabled={data.isLoading}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {data.isLoading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Errores */}
      {data.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{data.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {connectionStatus.isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Clientes</h3>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {data.customers.length}
              </span>
            </div>
            
            {data.customers.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.customers.slice(0, 5).map((customer: Customer) => (
                  <div key={customer.Id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {customer.DisplayName || customer.Name || customer.FullyQualifiedName || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customer.BillAddr?.City || 'Sin ciudad'}, {customer.BillAddr?.CountrySubDivisionCode || 'Sin estado'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{customer.PrimaryEmailAddr?.Address || 'Sin email'}</p>
                    </div>
                  </div>
                ))}
                {data.customers.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    ... y {data.customers.length - 5} más
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Productos</h3>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {data.products.length}
              </span>
            </div>
            
            {data.products.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.products.slice(0, 5).map((product: Product) => (
                  <div key={product.Id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.Name}</p>
                      <p className="text-xs text-gray-500">
                        {product.Type} {product.Sku ? `• SKU: ${product.Sku}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${product.UnitPrice?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.QtyOnHand !== undefined ? `Stock: ${product.QtyOnHand}` : 'Sin stock'}
                      </p>
                    </div>
                  </div>
                ))}
                {data.products.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    ... y {data.products.length - 5} más
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado de carga */}
      {data.isLoading && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600">Cargando datos de QuickBooks...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickBooksDataDisplay;