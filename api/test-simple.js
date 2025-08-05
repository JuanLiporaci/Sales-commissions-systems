/**
 * Endpoint de prueba simple para verificar que Vercel funciona
 */

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const timestamp = new Date().toISOString();
    
    console.log('✅ Test endpoint called at:', timestamp);
    
    return res.status(200).json({
      success: true,
      message: 'Vercel está funcionando correctamente',
      timestamp: timestamp,
      method: req.method,
      url: req.url,
      vercelRegion: process.env.VERCEL_REGION || 'unknown',
      nodeVersion: process.version
    });

  } catch (error) {
    console.error('❌ Error in test endpoint:', error);
    return res.status(500).json({
      error: 'Test endpoint error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}