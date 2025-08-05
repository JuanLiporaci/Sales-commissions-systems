/**
 * QuickBooks API Final - Solución completa y robusta
 * 
 * Este endpoint maneja todas las operaciones de QuickBooks de manera unificada
 */

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🚀 QuickBooks API Final iniciado');
  console.log('📊 Method:', req.method);
  console.log('📊 URL:', req.url);
  
  try {
    // TOKEN EXCHANGE
    if (req.method === 'POST' && req.url === '/api/quickbooks-final?action=token') {
      return await handleTokenExchange(req, res);
    }
    
    // DATA FETCH
    if (req.method === 'GET') {
      return await handleDataFetch(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error en QuickBooks API Final:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Maneja el intercambio de tokens OAuth
 */
async function handleTokenExchange(req, res) {
  console.log('🔄 Procesando intercambio de token...');
  
  try {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const clientId = 'ABeUukPao9RA1rdByKMtbow5HSWo0L9LAyJm6H20tqHgQvX10q';
    const clientSecret = 'evZIr3WqKoT0P9fdvtuPeD8qX12GMiMhCDKaFVnr';
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

    console.log('📡 Haciendo request a QuickBooks token endpoint');
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri || 'https://sales-commissions-systems.vercel.app/callback'
      }).toString()
    });

    console.log('📊 Token response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token exchange failed:', errorText);
      return res.status(response.status).json({
        error: 'Token exchange failed',
        details: errorText
      });
    }

    const tokenData = await response.json();
    console.log('✅ Token obtenido exitosamente');

    return res.status(200).json({
      success: true,
      data: tokenData
    });

  } catch (error) {
    console.error('❌ Error en intercambio de token:', error);
    return res.status(500).json({
      error: 'Token exchange error',
      message: error.message
    });
  }
}

/**
 * Maneja la obtención de datos de QuickBooks
 */
async function handleDataFetch(req, res) {
  console.log('📊 Procesando obtención de datos...');
  
  try {
    const { type, realmId } = req.query;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    console.log('📋 Parámetros recibidos:');
    console.log('  - Type:', type);
    console.log('  - Realm ID:', realmId);
    console.log('  - Token presente:', !!accessToken);

    // Validaciones
    if (!type || !realmId || !accessToken) {
      return res.status(400).json({
        error: 'Missing required parameters',
        received: { type, realmId, hasToken: !!accessToken }
      });
    }

    // Construir query según el tipo
    let query;
    switch (type) {
      case 'customers':
        query = 'SELECT * FROM Customer WHERE Active = true MAXRESULTS 20';
        break;
      case 'products':
      case 'items':
        query = "SELECT * FROM Item WHERE Active = true MAXRESULTS 20";
        break;
      case 'companyinfo':
        query = 'SELECT * FROM CompanyInfo';
        break;
      default:
        return res.status(400).json({ error: 'Invalid type. Use: customers, products, items, or companyinfo' });
    }

    // Hacer la llamada a QuickBooks
    const apiUrl = `https://api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`;
    console.log('🔗 QuickBooks URL:', apiUrl);

    const startTime = Date.now();
    const qbResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    const responseTime = Date.now() - startTime;

    console.log('📊 QuickBooks response:');
    console.log('  - Status:', qbResponse.status);
    console.log('  - Status Text:', qbResponse.statusText);
    console.log('  - Response Time:', responseTime + 'ms');

    if (!qbResponse.ok) {
      const errorText = await qbResponse.text();
      console.error('❌ QuickBooks API error:', errorText);
      
      return res.status(qbResponse.status).json({
        error: 'QuickBooks API error',
        status: qbResponse.status,
        statusText: qbResponse.statusText,
        details: errorText,
        query: query,
        responseTime: responseTime
      });
    }

    const qbData = await qbResponse.json();
    console.log('✅ Datos obtenidos exitosamente');
    console.log('📊 Response keys:', Object.keys(qbData));

    // Procesar y formatear los datos
    let processedData = qbData;
    if (qbData.QueryResponse) {
      if (type === 'customers' && qbData.QueryResponse.Customer) {
        processedData = {
          ...qbData,
          count: qbData.QueryResponse.Customer.length,
          items: qbData.QueryResponse.Customer
        };
      } else if ((type === 'products' || type === 'items') && qbData.QueryResponse.Item) {
        processedData = {
          ...qbData,
          count: qbData.QueryResponse.Item.length,
          items: qbData.QueryResponse.Item
        };
      } else if (type === 'companyinfo' && qbData.QueryResponse.CompanyInfo) {
        processedData = {
          ...qbData,
          company: qbData.QueryResponse.CompanyInfo[0]
        };
      }
    }

    return res.status(200).json({
      success: true,
      type: type,
      realmId: realmId,
      query: query,
      responseTime: responseTime,
      data: processedData
    });

  } catch (error) {
    console.error('❌ Error en obtención de datos:', error);
    return res.status(500).json({
      error: 'Data fetch error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
  }
}