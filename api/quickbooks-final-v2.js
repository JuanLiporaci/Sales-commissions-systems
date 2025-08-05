/**
 * QuickBooks API Final v2 - Solución mejorada para 502 errors
 * 
 * Este endpoint maneja todas las operaciones de QuickBooks con mejor manejo de errores
 */

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🚀 QuickBooks API Final v2 iniciado');
  console.log('📊 Method:', req.method);
  console.log('📊 URL:', req.url);
  console.log('📊 Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    // TOKEN EXCHANGE
    if (req.method === 'POST' && req.url?.includes('action=token')) {
      return await handleTokenExchange(req, res);
    }
    
    // DATA FETCH
    if (req.method === 'GET') {
      return await handleDataFetch(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error en QuickBooks API Final v2:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
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
 * Maneja la obtención de datos de QuickBooks con mejor manejo de errores
 */
async function handleDataFetch(req, res) {
  console.log('📊 Procesando obtención de datos v2...');
  
  try {
    const { type, realmId } = req.query;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');

    console.log('📋 Parámetros recibidos:');
    console.log('  - Type:', type);
    console.log('  - Realm ID:', realmId);
    console.log('  - Auth Header:', authHeader ? 'Present' : 'Missing');
    console.log('  - Token presente:', !!accessToken);
    console.log('  - Token length:', accessToken?.length || 0);

    // Validaciones mejoradas
    if (!type) {
      return res.status(400).json({
        error: 'Missing type parameter',
        received: { type, realmId, hasToken: !!accessToken }
      });
    }

    if (!realmId) {
      return res.status(400).json({
        error: 'Missing realmId parameter',
        received: { type, realmId, hasToken: !!accessToken }
      });
    }

    if (!accessToken) {
      return res.status(401).json({
        error: 'Missing access token',
        received: { type, realmId, hasToken: false, authHeader: authHeader || 'missing' }
      });
    }

    // Validar formato del token
    if (accessToken.length < 10) {
      return res.status(401).json({
        error: 'Invalid access token format',
        tokenLength: accessToken.length
      });
    }

    // Construir query según el tipo
    let query;
    switch (type) {
      case 'customers':
        query = 'SELECT * FROM Customer WHERE Active = true MAXRESULTS 10';
        break;
      case 'products':
      case 'items':
        query = "SELECT * FROM Item WHERE Active = true MAXRESULTS 10";
        break;
      case 'companyinfo':
        query = 'SELECT * FROM CompanyInfo';
        break;
      default:
        return res.status(400).json({ 
          error: 'Invalid type. Use: customers, products, items, or companyinfo',
          receivedType: type
        });
    }

    // Construir URL de QuickBooks API
    const baseApiUrl = 'https://api.intuit.com/v3/company';
    const apiUrl = `${baseApiUrl}/${realmId}/query?query=${encodeURIComponent(query)}`;
    
    console.log('🔗 QuickBooks URL construida:', apiUrl);
    console.log('📋 Query SQL:', query);

    // Preparar headers para QuickBooks
    const qbHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'User-Agent': 'SalesCommissionSystem/1.0'
    };

    console.log('📋 Headers para QuickBooks:', JSON.stringify(qbHeaders, null, 2));

    // Hacer la llamada a QuickBooks con timeout
    console.log('📡 Iniciando llamada a QuickBooks...');
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos timeout

    let qbResponse;
    try {
      qbResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: qbHeaders,
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return res.status(408).json({
          error: 'Request timeout',
          message: 'QuickBooks API call timed out after 25 seconds',
          type: type,
          realmId: realmId
        });
      }
      
      return res.status(502).json({
        error: 'Network error',
        message: fetchError.message,
        type: fetchError.name,
        query: query
      });
    }
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    console.log('📊 QuickBooks response recibida:');
    console.log('  - Status:', qbResponse.status);
    console.log('  - Status Text:', qbResponse.statusText);
    console.log('  - Response Time:', responseTime + 'ms');
    console.log('  - Headers:', JSON.stringify(Object.fromEntries(qbResponse.headers.entries()), null, 2));

    // Manejar respuesta no exitosa
    if (!qbResponse.ok) {
      let errorDetails = '';
      try {
        errorDetails = await qbResponse.text();
        console.error('❌ QuickBooks API error details:', errorDetails);
      } catch (e) {
        console.error('❌ No se pudo leer el error:', e.message);
        errorDetails = 'Unable to read error details';
      }
      
      return res.status(qbResponse.status).json({
        error: 'QuickBooks API error',
        status: qbResponse.status,
        statusText: qbResponse.statusText,
        details: errorDetails,
        query: query,
        responseTime: responseTime,
        apiUrl: apiUrl.replace(accessToken, 'REDACTED')
      });
    }

    // Procesar respuesta exitosa
    let qbData;
    try {
      const responseText = await qbResponse.text();
      console.log('📄 Response text length:', responseText.length);
      console.log('📄 Response text preview:', responseText.substring(0, 200) + '...');
      
      qbData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      return res.status(502).json({
        error: 'Invalid JSON response from QuickBooks',
        message: parseError.message,
        responseTime: responseTime
      });
    }

    console.log('✅ Datos obtenidos exitosamente');
    console.log('📊 Response keys:', Object.keys(qbData));
    
    if (qbData.QueryResponse) {
      console.log('📊 QueryResponse keys:', Object.keys(qbData.QueryResponse));
    }

    // Procesar y formatear los datos
    let processedData = qbData;
    if (qbData.QueryResponse) {
      if (type === 'customers' && qbData.QueryResponse.Customer) {
        processedData = {
          ...qbData,
          count: qbData.QueryResponse.Customer.length,
          items: qbData.QueryResponse.Customer
        };
        console.log('📊 Customers found:', qbData.QueryResponse.Customer.length);
      } else if ((type === 'products' || type === 'items') && qbData.QueryResponse.Item) {
        processedData = {
          ...qbData,
          count: qbData.QueryResponse.Item.length,
          items: qbData.QueryResponse.Item
        };
        console.log('📊 Items found:', qbData.QueryResponse.Item.length);
      } else if (type === 'companyinfo' && qbData.QueryResponse.CompanyInfo) {
        processedData = {
          ...qbData,
          company: qbData.QueryResponse.CompanyInfo[0]
        };
        console.log('📊 Company info found');
      } else {
        console.log('⚠️ No data found in QueryResponse for type:', type);
        console.log('⚠️ Available keys:', Object.keys(qbData.QueryResponse));
      }
    } else {
      console.log('⚠️ No QueryResponse in data');
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
    console.error('❌ Error inesperado en obtención de datos:', error);
    return res.status(500).json({
      error: 'Data fetch unexpected error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      timestamp: new Date().toISOString()
    });
  }
}