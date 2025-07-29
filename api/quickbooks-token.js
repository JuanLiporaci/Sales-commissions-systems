/**
 * QuickBooks Token Exchange API
 * 
 * This API route handles the OAuth2 token exchange for QuickBooks
 * to avoid CORS issues when making requests from the browser.
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirect_uri } = req.body;

    // Validate required parameters
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // QuickBooks API configuration
    const QB_CONFIG = {
      clientId: 'ABeUukPao9RA1rdByKMtbow5HSWo0L9LAyJm6H20tqHgQvX10q',
      clientSecret: 'evZIr3WqKoT0P9fdvtuPeD8qX12GMiMhCDKaFVnr',
      tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      redirectUri: redirect_uri || 'https://sales-commissions-systems.vercel.app/callback'
    };

    // Create Basic Auth header
    const authHeader = `Basic ${Buffer.from(`${QB_CONFIG.clientId}:${QB_CONFIG.clientSecret}`).toString('base64')}`;

    console.log('🔄 Exchanging authorization code for token...');
    console.log('🔗 Token URL:', QB_CONFIG.tokenUrl);
    console.log('🔑 Client ID:', QB_CONFIG.clientId);

    // Exchange authorization code for access token
    const response = await fetch(QB_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: QB_CONFIG.redirectUri
      })
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token exchange error:', errorText);
      
      // Try to parse error response
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: 'Unknown error', error_description: errorText };
      }
      
      return res.status(response.status).json({
        error: 'Token exchange failed',
        details: errorData
      });
    }

    const tokenData = await response.json();
    console.log('✅ Token exchange successful');

    // Return the token data
    return res.status(200).json({
      success: true,
      data: tokenData
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}