/**
 * QuickBooks Debug API
 * 
 * Simple debug endpoint to identify the exact issue
 */

export default async function handler(req, res) {
  console.log('🔍 DEBUG: QuickBooks API called');
  console.log('📊 Method:', req.method);
  console.log('📊 Headers:', req.headers);
  console.log('📊 Query:', req.query);

  try {
    // 1. Check if we have the required parameters
    const { type, realmId } = req.query;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    console.log('🔍 DEBUG: Parameters check');
    console.log('📊 Type:', type);
    console.log('📊 Realm ID:', realmId);
    console.log('📊 Token present:', !!accessToken);
    console.log('📊 Token length:', accessToken ? accessToken.length : 0);

    if (!type || !realmId) {
      console.log('❌ DEBUG: Missing parameters');
      return res.status(400).json({ 
        error: 'Missing parameters',
        received: { type, realmId, hasToken: !!accessToken }
      });
    }

    if (!accessToken) {
      console.log('❌ DEBUG: No access token');
      return res.status(401).json({ 
        error: 'No access token',
        received: { type, realmId, hasToken: false }
      });
    }

    // 2. Test the token format
    console.log('🔍 DEBUG: Testing token format');
    console.log('📊 Token starts with:', accessToken.substring(0, 10) + '...');
    
    // 3. Try a very simple request first
    console.log('🔍 DEBUG: Making simple test request');
    
    const testUrl = `https://api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`;
    console.log('📊 Test URL:', testUrl);

    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    console.log('📊 Test response status:', testResponse.status);
    console.log('📊 Test response ok:', testResponse.ok);

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.log('❌ DEBUG: Test request failed');
      console.log('📊 Error text:', errorText);
      
      return res.status(testResponse.status).json({
        error: 'Test request failed',
        status: testResponse.status,
        statusText: testResponse.statusText,
        details: errorText,
        debug: {
          type,
          realmId,
          hasToken: !!accessToken,
          tokenLength: accessToken.length
        }
      });
    }

    // 4. If test passes, try the actual query
    console.log('✅ DEBUG: Test request successful, trying actual query');
    
    let query;
    if (type === 'customers') {
      query = 'SELECT * FROM Customer WHERE Active = true MAXRESULTS 5';
    } else if (type === 'products') {
      query = "SELECT * FROM Item WHERE Type = 'Inventory' OR Type = 'NonInventory' MAXRESULTS 5";
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const apiUrl = `https://api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`;
    console.log('📊 Actual query URL:', apiUrl);
    console.log('📊 Query:', query);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Actual response status:', response.status);
    console.log('📊 Actual response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ DEBUG: Actual query failed');
      console.log('📊 Error text:', errorText);
      
      return res.status(response.status).json({
        error: 'Query failed',
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        query: query,
        debug: {
          type,
          realmId,
          hasToken: !!accessToken,
          tokenLength: accessToken.length
        }
      });
    }

    const data = await response.json();
    console.log('✅ DEBUG: Query successful');
    console.log('📊 Response keys:', Object.keys(data));
    
    if (data.QueryResponse) {
      const itemKey = type === 'customers' ? 'Customer' : 'Item';
      const items = data.QueryResponse[itemKey] || [];
      console.log(`📊 ${type} found:`, items.length);
    }

    return res.status(200).json({
      success: true,
      message: 'Debug successful',
      data: data,
      debug: {
        type,
        realmId,
        hasToken: !!accessToken,
        tokenLength: accessToken.length,
        query: query
      }
    });

  } catch (error) {
    console.log('❌ DEBUG: Unexpected error');
    console.log('📊 Error:', error.message);
    console.log('📊 Error type:', error.name);
    console.log('📊 Error stack:', error.stack);
    
    return res.status(500).json({
      error: 'Unexpected error',
      message: error.message,
      type: error.name,
      debug: {
        query: req.query,
        hasToken: !!req.headers.authorization
      }
    });
  }
} 