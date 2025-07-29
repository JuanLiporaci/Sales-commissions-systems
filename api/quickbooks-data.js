/**
 * QuickBooks Data API Proxy
 * 
 * This API route handles data requests to QuickBooks API
 * to avoid CORS issues when making requests from the browser.
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, realmId } = req.query;

    // Validate required parameters
    if (!type || !realmId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: type and realmId are required' 
      });
    }

    // Get access token from request headers
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    console.log('🔍 QuickBooks Data API Debug Info:');
    console.log('📊 Type:', type);
    console.log('🏢 Realm ID:', realmId);
    console.log('🔑 Token present:', !!accessToken);
    console.log('🔑 Token length:', accessToken.length);

    // QuickBooks API configuration
    const QB_CONFIG = {
      apiUrl: 'https://api.intuit.com/v3/company',
      clientId: 'ABeUukPao9RA1rdByKMtbow5HSWo0L9LAyJm6H20tqHgQvX10q',
      clientSecret: 'evZIr3WqKoT0P9fdvtuPeD8qX12GMiMhCDKaFVnr'
    };

    // Build query based on type
    let query;
    if (type === 'customers') {
      query = 'SELECT * FROM Customer WHERE Active = true ORDER BY DisplayName';
    } else if (type === 'products') {
      query = "SELECT * FROM Item WHERE Type = 'Inventory' OR Type = 'NonInventory' ORDER BY Name";
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be "customers" or "products"' });
    }

    // Build the API URL
    const apiUrl = `${QB_CONFIG.apiUrl}/${realmId}/query?query=${encodeURIComponent(query)}`;

    console.log('🔄 Fetching QuickBooks data...');
    console.log('🔗 API URL:', apiUrl);
    console.log('📊 Query:', query);

    // Make request to QuickBooks API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Sales-Commissions-System/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ QuickBooks API error response:', errorText);
        
        // Try to parse error response
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: 'Unknown error', error_description: errorText };
        }
        
        return res.status(response.status).json({
          error: 'QuickBooks API request failed',
          details: errorData,
          status: response.status,
          statusText: response.statusText
        });
      }

      const data = await response.json();
      console.log('✅ QuickBooks data fetched successfully');
      console.log('📊 Data structure:', Object.keys(data));
      console.log('📊 QueryResponse keys:', data.QueryResponse ? Object.keys(data.QueryResponse) : 'No QueryResponse');
      
      if (data.QueryResponse) {
        const itemKey = type === 'customers' ? 'Customer' : 'Item';
        const items = data.QueryResponse[itemKey] || [];
        console.log(`📊 ${type} count:`, items.length);
      }

      // Return the data
      return res.status(200).json({
        success: true,
        data: data
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ Request timeout');
        return res.status(408).json({
          error: 'Request timeout',
          message: 'QuickBooks API request timed out after 30 seconds'
        });
      }
      
      console.error('❌ Fetch error:', fetchError);
      return res.status(500).json({
        error: 'Network error',
        message: fetchError.message,
        type: fetchError.name
      });
    }

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
}