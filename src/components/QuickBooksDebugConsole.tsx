import React, { useState } from 'react';
import { quickBooksService } from '../services/quickbooks.js';

const QuickBooksDebugConsole: React.FC = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing QuickBooks connection...');
      
      const connectionInfo = {
        isAuthenticated: quickBooksService.isAuthenticated(),
        hasToken: !!quickBooksService._token,
        hasRefreshToken: !!quickBooksService._refreshToken,
        hasRealmId: !!quickBooksService._realmId,
        realmId: quickBooksService._realmId,
        tokenExpiry: quickBooksService._tokenExpiry ? new Date(quickBooksService._tokenExpiry).toLocaleString() : null
      };
      
      console.log('📊 Connection info:', connectionInfo);
      
      setDebugData({
        type: 'connection',
        data: connectionInfo,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('❌ Connection test failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testAPI = async (endpoint: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Testing API endpoint: ${endpoint}`);
      
      const url = `/api/quickbooks-final-v2?type=${endpoint}&realmId=${quickBooksService._realmId}`;
      console.log('🔗 Full URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${quickBooksService._token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📊 Raw response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawText: responseText };
      }
      
      setDebugData({
        type: 'api_test',
        endpoint,
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error(`❌ API test failed for ${endpoint}:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testCustomers = () => testAPI('customers');
  const testProducts = () => testAPI('products');
  const testCompanyInfo = () => testAPI('companyinfo');

  const testSimpleEndpoint = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing simple endpoint...');
      
      const response = await fetch('/api/test-simple');
      const data = await response.json();
      
      setDebugData({
        type: 'simple_test',
        data,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('❌ Simple test failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testV2Endpoint = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing V2 endpoint directly...');
      
      const timestamp = Date.now();
      const response = await fetch(`/api/quickbooks-final-v2?type=companyinfo&realmId=${quickBooksService._realmId}&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${quickBooksService._token}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('📊 V2 Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📊 V2 Raw response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawText: responseText };
      }
      
      setDebugData({
        type: 'v2_test',
        url: `/api/quickbooks-final-v2?type=companyinfo&realmId=${quickBooksService._realmId}`,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('❌ V2 test failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
      <h3 className="text-lg font-bold mb-4 text-white">QuickBooks Debug Console</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
        >
          Test Connection
        </button>
        
        <button
          onClick={testSimpleEndpoint}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
        >
          Test Simple
        </button>
        
        <button
          onClick={testV2Endpoint}
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-bold"
        >
          Test V2 API
        </button>
        
        <button
          onClick={testCompanyInfo}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs"
        >
          Test Company
        </button>
        
        <button
          onClick={testCustomers}
          disabled={isLoading}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
        >
          Test Customers
        </button>
        
        <button
          onClick={testProducts}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
        >
          Test Products
        </button>
      </div>
      
      {isLoading && (
        <div className="text-yellow-400 mb-2">⏳ Loading...</div>
      )}
      
      {error && (
        <div className="text-red-400 mb-2">❌ Error: {error}</div>
      )}
      
      {debugData && (
        <div className="bg-gray-800 p-3 rounded max-h-96 overflow-auto">
          <div className="text-cyan-400 mb-2">
            📊 Debug Result ({debugData.type}) - {debugData.timestamp}
          </div>
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default QuickBooksDebugConsole;