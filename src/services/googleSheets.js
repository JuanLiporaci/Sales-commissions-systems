/**
 * Google Sheets Service
 * Servicio para enviar pedidos/ventas automáticamente a Google Sheets
 */

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
    
    // Obtener credenciales desde variables de entorno
    this.credentials = this.getCredentialsFromEnv();
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Obtener credenciales desde variables de entorno
   */
  getCredentialsFromEnv() {
    try {
      // Usar variables de entorno para producción
      const privateKey = import.meta.env.VITE_FIREBASE_PRIVATE_KEY;
      const clientEmail = import.meta.env.VITE_FIREBASE_CLIENT_EMAIL;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

      if (!privateKey || !clientEmail || !projectId) {
        console.log('Variables de entorno de Firebase no configuradas');
        return null;
      }

      // Decodificar la clave privada si está en base64
      let decodedPrivateKey = privateKey;
      try {
        // Si la clave viene en base64 (común en variables de entorno)
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          decodedPrivateKey = atob(privateKey);
        }
      } catch (e) {
        // Si no se puede decodificar, usar tal como viene
        decodedPrivateKey = privateKey;
      }

      return {
        type: "service_account",
        project_id: projectId,
        private_key: decodedPrivateKey,
        client_email: clientEmail,
        client_id: import.meta.env.VITE_FIREBASE_CLIENT_ID || "",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
      };
    } catch (error) {
      console.error('Error obteniendo credenciales:', error);
      return null;
    }
  }

  /**
   * Obtener token de acceso usando las credenciales de servicio
   */
  async getAccessToken() {
    // Verificar si el token actual sigue siendo válido
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    try {
      // Crear JWT para autenticación
      const jwt = await this.createJWT();
      
      // Intercambiar JWT por access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo token: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error obteniendo access token:', error);
      throw error;
    }
  }

  /**
   * Crear JWT para autenticación con Google
   */
  async createJWT() {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Codificar header y payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m])).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m])).replace(/=/g, '');
    
    const message = `${encodedHeader}.${encodedPayload}`;
    
    // Firmar con la clave privada
    const signature = await this.signMessage(message, this.credentials.private_key);
    
    return `${message}.${signature}`;
  }

  /**
   * Firmar mensaje con RSA-SHA256
   */
  async signMessage(message, privateKey) {
    // Limpiar la clave privada
    const pemKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    // Convertir de base64 a ArrayBuffer
    const keyData = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));

    // Importar la clave
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Firmar el mensaje
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(message)
    );

    // Convertir a base64url
    const signatureArray = new Uint8Array(signatureBuffer);
    const signature = btoa(String.fromCharCode(...signatureArray))
      .replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m]))
      .replace(/=/g, '');

    return signature;
  }

  /**
   * Agregar una fila al Google Sheet
   */
  async agregarPedido(datosVenta) {
    try {
      const token = await this.getAccessToken();
      
      // Preparar los datos según las columnas especificadas
      const productos = datosVenta.productos || [];
      const productosTexto = productos.map(p => 
        `${p.description || p.nombre || p.name || ''}`
      ).join(', ');
      
      const cantidades = productos.map(p => p.cantidad || 1).join(', ');
      const codigos = productos.map(p => p.code || p.id || '').join(', ');
      
      const fila = [
        datosVenta.cliente || '',                           // Nombre del Cliente
        productosTexto,                                     // Productos
        cantidades,                                         // Cantidad
        datosVenta.fecha || new Date().toISOString().split('T')[0], // Fecha de Despacho
        codigos,                                            // codigo
        datosVenta.notas || '',                            // Notas
        datosVenta.usuarioEmail || '',                     // Usuario
        new Date().toISOString(),                          // Fecha de subida
        'Sistema Ventas'                                   // Proveedor
      ];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/web!A:I:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [fila],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error agregando al Google Sheet: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('Pedido agregado al Google Sheet exitosamente:', result);
      return result;
    } catch (error) {
      console.error('Error enviando a Google Sheets:', error);
      // No lanzar error para que no interrumpa el proceso de venta
      // Solo registrar el error
      return null;
    }
  }

  /**
   * Verificar configuración
   */
  isConfigured() {
    return !!(this.spreadsheetId && this.credentials && this.credentials.private_key);
  }
}

// Crear instancia del servicio
const googleSheetsService = new GoogleSheetsService();

export default googleSheetsService; 