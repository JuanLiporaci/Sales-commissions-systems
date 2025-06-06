/**
 * QuickBooks API Service
 * 
 * This service handles communication with the QuickBooks API to fetch customer
 * data, addresses, and other relevant information for the application.
 */

// Configuration for QuickBooks API - these should be stored in environment variables
const QB_API_CONFIG = {
  baseUrl: process.env.REACT_APP_QB_API_BASE_URL || 'https://quickbooks.api.intuit.com/v3',
  clientId: process.env.REACT_APP_QB_CLIENT_ID,
  clientSecret: process.env.REACT_APP_QB_CLIENT_SECRET,
  redirectUri: process.env.REACT_APP_QB_REDIRECT_URI,
  environment: process.env.REACT_APP_QB_ENVIRONMENT || 'sandbox', // or 'production'
};

// QuickBooks API Client
export const quickBooksService = {
  // Token storage
  _token: null,
  _refreshToken: null,
  _tokenExpiry: null,

  /**
   * Check if we have a valid token
   * @returns {boolean} True if token is valid, false otherwise
   */
  isAuthenticated() {
    if (!this._token || !this._tokenExpiry) {
      return false;
    }
    
    // Check if token is expired (with 5 minute buffer)
    return new Date().getTime() < this._tokenExpiry - 300000;
  },

  /**
   * Get customers from QuickBooks API
   * @returns {Promise<Array>} Array of customer objects
   */
  async getCustomers() {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('QuickBooks API no autenticado. Debe autorizar la aplicación primero.');
      }

      // In a real implementation, this would make an actual API call to QuickBooks
      // For now, we're mocking the response
      console.log('Fetching customers from QuickBooks API...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - in a real implementation, this would be the API response
      return [
        {
          id: 'qb-1001',
          displayName: 'Ejemplo Cliente 1',
          fullName: 'Ejemplo Cliente 1, S.A.',
          primaryPhone: '555-123-4567',
          primaryEmailAddr: { address: 'cliente1@ejemplo.com' },
          billAddr: {
            line1: 'Calle Principal 123',
            city: 'Ciudad de México',
            country: 'México',
            countrySubDivisionCode: 'CDMX',
            postalCode: '11000'
          },
          shipAddr: {
            line1: 'Av. Ejemplo 456',
            city: 'Ciudad de México',
            country: 'México',
            countrySubDivisionCode: 'CDMX',
            postalCode: '11300'
          }
        },
        {
          id: 'qb-1002',
          displayName: 'Ejemplo Cliente 2',
          fullName: 'Ejemplo Cliente 2, S.A.',
          primaryPhone: '555-987-6543',
          primaryEmailAddr: { address: 'cliente2@ejemplo.com' },
          billAddr: {
            line1: 'Paseo de la Reforma 222',
            city: 'Ciudad de México',
            country: 'México',
            countrySubDivisionCode: 'CDMX',
            postalCode: '06600'
          },
          shipAddr: null // Same as billing
        }
      ];
    } catch (error) {
      console.error('Error fetching QuickBooks customers:', error);
      throw error;
    }
  },

  /**
   * Convert QuickBooks customers to our location format
   * @param {Array} customers - Array of QuickBooks customer objects
   * @returns {Array} Formatted location data
   */
  formatCustomersAsLocations(customers) {
    if (!Array.isArray(customers)) {
      return [];
    }
    
    return customers.map(customer => {
      const billAddr = customer.billAddr || {};
      const shipAddr = customer.shipAddr || billAddr;
      
      // Format the billing address as a single string
      const formatAddress = (addr) => {
        if (!addr) return '';
        const parts = [
          addr.line1,
          addr.line2,
          addr.city,
          addr.countrySubDivisionCode,
          addr.postalCode,
          addr.country
        ].filter(Boolean);
        return parts.join(', ');
      };
      
      const billAddressStr = formatAddress(billAddr);
      const shipAddressStr = formatAddress(shipAddr);
      
      return {
        name: customer.displayName || customer.fullName || '',
        address: billAddressStr,
        city: billAddr.city || '',
        state: billAddr.countrySubDivisionCode || '',
        zipCode: billAddr.postalCode || '',
        contactName: customer.fullName || customer.displayName || '',
        contactPhone: customer.primaryPhone || '',
        email: customer.primaryEmailAddr?.address || '',
        notes: shipAddressStr !== billAddressStr ? `Ship address: ${shipAddressStr}` : '',
        qbCustomerId: customer.id,
        createdAt: new Date().toISOString(),
      };
    }).filter(location => location.name && location.address);
  },

  /**
   * Import customers from QuickBooks and convert to locations
   * @returns {Promise<Array>} Formatted location data
   */
  async importCustomersAsLocations() {
    try {
      const customers = await this.getCustomers();
      return this.formatCustomersAsLocations(customers);
    } catch (error) {
      console.error('Error importing QuickBooks customers as locations:', error);
      throw error;
    }
  },

  /**
   * Authenticate with QuickBooks OAuth
   * This is a placeholder - actual implementation would redirect to QuickBooks OAuth
   * @returns {Promise<boolean>} True if authentication is successful
   */
  async authenticate() {
    // In a real implementation, this would redirect to QuickBooks OAuth
    // and handle the OAuth flow
    console.log('Redirecting to QuickBooks OAuth...');
    
    // For now, just simulate a successful authentication
    this._token = 'mock-token';
    this._refreshToken = 'mock-refresh-token';
    this._tokenExpiry = new Date().getTime() + 3600000; // 1 hour from now
    
    return true;
  }
};

export default quickBooksService; 