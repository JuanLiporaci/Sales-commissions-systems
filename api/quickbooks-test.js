/**
 * QuickBooks Test API
 * 
 * Simple test endpoint to verify QuickBooks connection
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

    console.log('🧪 QuickBooks Test API - Basic connection test');
    console.log('🔑 Token present:', !!accessToken);
    console.log('🔑 Token length:', accessToken.length);
    console.log('🏢 Realm ID:', realmId);

    // Test with a simple company info request
    const testUrl = `https://api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`;
    
    console.log('🔗 Test URL:', testUrl);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ QuickBooks test failed:', errorText);
      
      return res.status(response.status).json({
        error: 'QuickBooks test failed',
        status: response.status,
        statusText: response.statusText,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ QuickBooks test successful');
    console.log('📊 Company info:', data.CompanyInfo?.CompanyName || 'Unknown');

    return res.status(200).json({
      success: true,
      message: 'QuickBooks connection test successful',
      companyName: data.CompanyInfo?.CompanyName,
      data: data
    });

  } catch (error) {
    console.error('❌ QuickBooks test error:', error);
    return res.status(500).json({
      error: 'Test failed',
      message: error.message,
      type: error.name
    });
  }
} 