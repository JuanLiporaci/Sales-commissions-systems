/**
 * QuickBooks Simple Test API
 * 
 * Test with a very simple query to diagnose the issue
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const realmId = req.query.realmId;

    if (!accessToken || !realmId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: authorization header and realmId query parameter' 
      });
    }

    console.log('🧪 QuickBooks Simple Test - Very basic query');
    console.log('🔑 Token present:', !!accessToken);
    console.log('🔑 Token length:', accessToken.length);
    console.log('🏢 Realm ID:', realmId);

    // Test with the simplest possible query
    const simpleQuery = 'SELECT * FROM Customer MAXRESULTS 1';
    const apiUrl = `https://api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(simpleQuery)}`;
    
    console.log('🔗 API URL:', apiUrl);
    console.log('📊 Query:', simpleQuery);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ QuickBooks simple test failed:', errorText);
      
      return res.status(response.status).json({
        error: 'QuickBooks simple test failed',
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        query: simpleQuery
      });
    }

    const data = await response.json();
    console.log('✅ QuickBooks simple test successful');
    console.log('📊 Response structure:', Object.keys(data));
    
    if (data.QueryResponse) {
      console.log('📊 QueryResponse keys:', Object.keys(data.QueryResponse));
      const customers = data.QueryResponse.Customer || [];
      console.log('📊 Customers found:', customers.length);
    }

    return res.status(200).json({
      success: true,
      message: 'QuickBooks simple test successful',
      query: simpleQuery,
      data: data
    });

  } catch (error) {
    console.error('❌ QuickBooks simple test error:', error);
    return res.status(500).json({
      error: 'Simple test failed',
      message: error.message,
      type: error.name
    });
  }
} 