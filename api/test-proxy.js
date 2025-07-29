/**
 * Test endpoint to verify API routes are working
 */

export default async function handler(req, res) {
  return res.status(200).json({
    message: 'API proxy is working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/quickbooks-token',
      '/api/quickbooks-data'
    ]
  });
}