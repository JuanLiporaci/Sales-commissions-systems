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
    console.log('📊 Type:', type);

    // Make request to QuickBooks API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ QuickBooks API error:', errorText);
      
      // Try to parse error response
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: 'Unknown error', error_description: errorText };
      }
      
      return res.status(response.status).json({
        error: 'QuickBooks API request failed',
        details: errorData
      });
    }

    const data = await response.json();
    console.log('✅ QuickBooks data fetched successfully');
    console.log('📊 Data count:', data.QueryResponse ? Object.keys(data.QueryResponse).length : 0);

    // Return the data
    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}