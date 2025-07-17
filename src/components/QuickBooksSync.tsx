import React, { useState } from 'react';
import { quickBooksService } from '../services/quickbooks.js';
import { customersService } from '../services/customers.ts';
import { productsService } from '../services/products.js';

const QuickBooksSync: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    customers?: { added: number; updated: number };
    products?: { added: number; updated: number };
  }>({});
  const [error, setError] = useState<string | null>(null);

  const handleSyncCustomers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const customers = await customersService.syncCustomersFromQuickBooks();
      setSyncStatus(prev => ({
        ...prev,
        customers: { added: customers.length, updated: 0 } // Simplified for now
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const products = await productsService.syncProductsFromQuickBooks();
      setSyncStatus(prev => ({
        ...prev,
        products: { added: products.length, updated: 0 } // Simplified for now
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Sync customers first
      await customersService.syncCustomersFromQuickBooks();
      
      // Then sync products
      await productsService.syncProductsFromQuickBooks();
      
      setSyncStatus({
        customers: { added: 0, updated: 0 },
        products: { added: 0, updated: 0 }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar datos');
    } finally {
      setIsLoading(false);
    }
  };

  if (!quickBooksService.isAuthenticated()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Debes conectar con QuickBooks primero para sincronizar datos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Sincronización con QuickBooks
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleSyncCustomers}
            disabled={isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sincronizando...' : 'Sincronizar Clientes'}
          </button>
          
          <button
            onClick={handleSyncProducts}
            disabled={isLoading}
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sincronizando...' : 'Sincronizar Productos'}
          </button>
          
          <button
            onClick={handleSyncAll}
            disabled={isLoading}
            className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sincronizando...' : 'Sincronizar Todo'}
          </button>
        </div>
        
        {syncStatus.customers && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              Clientes sincronizados: {syncStatus.customers.added} nuevos, {syncStatus.customers.updated} actualizados
            </p>
          </div>
        )}
        
        {syncStatus.products && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm">
              Productos sincronizados: {syncStatus.products.added} nuevos, {syncStatus.products.updated} actualizados
            </p>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Información sincronizada:
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Clientes: nombres, direcciones, teléfonos, emails</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Productos: nombres, descripciones, precios, costos, SKUs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Precios actualizados automáticamente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBooksSync; 