/**
 * Test Simple API
 * 
 * Endpoint muy simple para verificar que Vercel funciona
 */

export default async function handler(req, res) {
  console.log('🔍 TEST SIMPLE: Endpoint llamado');
  console.log('📊 Method:', req.method);
  console.log('📊 Query:', req.query);
  console.log('📊 Headers:', Object.keys(req.headers));

  try {
    // Respuesta simple
    return res.status(200).json({
      success: true,
      message: 'Test simple funcionando',
      timestamp: new Date().toISOString(),
      method: req.method,
      query: req.query,
      headers: Object.keys(req.headers)
    });

  } catch (error) {
    console.error('❌ TEST SIMPLE: Error:', error);
    return res.status(500).json({
      error: 'Test simple failed',
      message: error.message
    });
  }
} 