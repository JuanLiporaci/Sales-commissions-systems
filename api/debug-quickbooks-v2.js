/**
 * QuickBooks Debug API v2
 * 
 * Versión mejorada con mejor manejo de errores
 */

export default async function handler(req, res) {
  console.log('🔍 DEBUG V2: QuickBooks API llamado');
  console.log('📊 Method:', req.method);
  console.log('📊 Query:', req.query);

  try {
    // 1. Verificar método
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Verificar parámetros
    const { type, realmId } = req.query;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    console.log('🔍 DEBUG V2: Parámetros');
    console.log('📊 Type:', type);
    console.log('📊 Realm ID:', realmId);
    console.log('📊 Token presente:', !!accessToken);

    if (!type || !realmId) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        received: { type, realmId, hasToken: !!accessToken }
      });
    }

    if (!accessToken) {
      return res.status(401).json({ 
        error: 'No access token',
        received: { type, realmId, hasToken: false }
      });
    }

    // 3. Construir query
    let query;
    if (type === 'customers') {
      query = 'SELECT * FROM Customer WHERE Active = true MAXRESULTS 5';
    } else if (type === 'products') {
      query = "SELECT * FROM Item WHERE Type = 'Inventory' OR Type = 'NonInventory' MAXRESULTS 5";
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // 4. Hacer request a QuickBooks
    console.log('🔍 DEBUG V2: Haciendo request a QuickBooks');
    const apiUrl = `https://api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`;
    console.log('📊 URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos timeout
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ DEBUG V2: Request failed');
      console.log('📊 Error text:', errorText);
      
      return res.status(response.status).json({
        error: 'QuickBooks request failed',
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        query: query
      });
    }

    const data = await response.json();
    console.log('✅ DEBUG V2: Request successful');
    console.log('📊 Response keys:', Object.keys(data));

    return res.status(200).json({
      success: true,
      message: 'Debug v2 successful',
      data: data,
      query: query
    });

  } catch (error) {
    console.error('❌ DEBUG V2: Unexpected error');
    console.error('📊 Error:', error.message);
    console.error('📊 Error type:', error.name);
    
    return res.status(500).json({
      error: 'Unexpected error',
      message: error.message,
      type: error.name
    });
  }
} 