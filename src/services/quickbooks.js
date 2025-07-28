/**
 * QuickBooks API Service
 * 
 * This service handles communication with the QuickBooks API to fetch customer
 * data, addresses, products, and pricing information.
 */

// Configuration for QuickBooks API
const QB_API_CONFIG = {
  baseUrl: 'https://accounts.platform.intuit.com/v1/oauth2',
  apiUrl: 'https://api.intuit.com/v3/company',
  clientId: 'ABeUukPao9RA1rdByKMtbow5HSWo0L9LAyJm6H20tqHgQvX10q',
  clientSecret: 'evZIr3WqKoT0P9fdvtuPeD8qX12GMiMhCDKaFVnr',
  redirectUri: 'https://sales-commissions-systems.vercel.app/callback',
  environment: 'production',
};

// QuickBooks API Client
export const quickBooksService = {
  // Token storage
  _token: null,
  _refreshToken: null,
  _tokenExpiry: null,
  _realmId: null,
  _autoConnectAttempted: false,

  /**
   * Initialize QuickBooks authentication
   */
  initialize() {
    // Check for stored tokens
    const storedToken = localStorage.getItem('qb_access_token');
    const storedRefreshToken = localStorage.getItem('qb_refresh_token');
    const storedExpiry = localStorage.getItem('qb_token_expiry');
    const storedRealmId = localStorage.getItem('qb_realm_id');

    if (storedToken && storedRefreshToken && storedExpiry && storedRealmId) {
      this._token = storedToken;
      this._refreshToken = storedRefreshToken;
      this._tokenExpiry = parseInt(storedExpiry);
      this._realmId = storedRealmId;
      
      // Auto-refresh token if needed
      this.autoRefreshToken();
    } else {
      // Try to auto-connect if we have the client secret
      this.autoConnect();
    }
  },

  /**
   * Auto-connect to QuickBooks using stored credentials
   */
  async autoConnect() {
    if (this._autoConnectAttempted) return;
    this._autoConnectAttempted = true;

    try {
      // Check if we have the client secret
      if (!QB_API_CONFIG.clientSecret) {
        console.log('QuickBooks Client Secret not configured, skipping auto-connect');
        return;
      }

      // Check for existing valid tokens
      const storedToken = localStorage.getItem('qb_access_token');
      const storedRefreshToken = localStorage.getItem('qb_refresh_token');
      const storedExpiry = localStorage.getItem('qb_token_expiry');
      const storedRealmId = localStorage.getItem('qb_realm_id');

      if (storedToken && storedRefreshToken && storedExpiry && storedRealmId) {
        // Use existing tokens
        this._token = storedToken;
        this._refreshToken = storedRefreshToken;
        this._tokenExpiry = parseInt(storedExpiry);
        this._realmId = storedRealmId;
        
        // Check if token is still valid
        if (this._tokenExpiry > new Date().getTime()) {
          console.log('QuickBooks auto-connected using existing tokens');
          return;
        } else {
          // Token expired, try to refresh
          await this.refreshToken();
        }
      } else {
        console.log('No existing QuickBooks tokens found, manual connection required');
      }
    } catch (error) {
      console.error('QuickBooks auto-connect failed:', error);
    }
  },

  /**
   * Auto-refresh token if needed
   */
  async autoRefreshToken() {
    if (!this._refreshToken) return;
    
    // Check if token expires in the next 10 minutes
    const tenMinutesFromNow = new Date().getTime() + 600000;
    if (this._tokenExpiry < tenMinutesFromNow) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Auto-refresh token failed:', error);
      }
    }
  },

  /**
   * Check if we have a valid token
   * @returns {boolean} True if token is valid, false otherwise
   */
  isAuthenticated() {
    if (!this._token || !this._tokenExpiry || !this._realmId) {
      return false;
    }
    
    // Check if token is expired (with 5 minute buffer)
    return new Date().getTime() < this._tokenExpiry - 300000;
  },

  /**
   * Start OAuth2 flow
   */
  startAuth() {
    const authUrl = `${QB_API_CONFIG.baseUrl}/authorize?` +
      `client_id=${QB_API_CONFIG.clientId}&` +
      `response_type=code&` +
      `scope=com.intuit.quickbooks.accounting&` +
      `redirect_uri=${encodeURIComponent(QB_API_CONFIG.redirectUri)}&` +
      `state=${Math.random().toString(36).substring(7)}`;

    window.location.href = authUrl;
  },

  /**
   * Handle OAuth2 callback
   * @param {string} code - Authorization code from QuickBooks
   * @param {string} realmId - Company realm ID
   * @returns {Promise<boolean>} True if authentication is successful
   */
  async handleCallback(code, realmId) {
    try {
      const response = await fetch(`${QB_API_CONFIG.baseUrl}/tokens/bearer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${QB_API_CONFIG.clientId}:${QB_API_CONFIG.clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: QB_API_CONFIG.redirectUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await response.json();
      
      this._token = tokenData.access_token;
      this._refreshToken = tokenData.refresh_token;
      this._tokenExpiry = new Date().getTime() + (tokenData.expires_in * 1000);
      this._realmId = realmId;

      // Store tokens
      localStorage.setItem('qb_access_token', this._token);
      localStorage.setItem('qb_refresh_token', this._refreshToken);
      localStorage.setItem('qb_token_expiry', this._tokenExpiry.toString());
      localStorage.setItem('qb_realm_id', this._realmId);

      return true;
    } catch (error) {
      console.error('Error handling QuickBooks callback:', error);
      throw error;
    }
  },

  /**
   * Refresh access token
   * @returns {Promise<boolean>} True if refresh is successful
   */
  async refreshToken() {
    try {
      const response = await fetch(`${QB_API_CONFIG.baseUrl}/tokens/bearer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${QB_API_CONFIG.clientId}:${QB_API_CONFIG.clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this._refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenData = await response.json();
      
      this._token = tokenData.access_token;
      this._refreshToken = tokenData.refresh_token || this._refreshToken;
      this._tokenExpiry = new Date().getTime() + (tokenData.expires_in * 1000);

      // Update stored tokens
      localStorage.setItem('qb_access_token', this._token);
      localStorage.setItem('qb_refresh_token', this._refreshToken);
      localStorage.setItem('qb_token_expiry', this._tokenExpiry.toString());

      return true;
    } catch (error) {
      console.error('Error refreshing QuickBooks token:', error);
      throw error;
    }
  },

  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    if (!this.isAuthenticated()) {
      if (this._refreshToken) {
        await this.refreshToken();
      } else {
        // Try auto-connect if not authenticated
        await this.autoConnect();
        if (!this.isAuthenticated()) {
          throw new Error('QuickBooks API no autenticado. Debe autorizar la aplicación primero.');
        }
      }
    }

    const url = `${QB_API_CONFIG.apiUrl}/${this._realmId}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this._token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        await this.refreshToken();
        return this.makeRequest(endpoint, method, data);
      }
      throw new Error(`QuickBooks API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get customers from QuickBooks API
   * @returns {Promise<Array>} Array of customer objects
   */
  async getCustomers() {
    try {
      const response = await this.makeRequest('/query?query=SELECT * FROM Customer WHERE Active = true ORDER BY DisplayName');
      return response.QueryResponse.Customer || [];
    } catch (error) {
      console.error('Error fetching QuickBooks customers:', error);
      throw error;
    }
  },

  /**
   * Get products/items from QuickBooks API
   * @returns {Promise<Array>} Array of product objects
   */
  async getProducts() {
    try {
      const response = await this.makeRequest('/query?query=SELECT * FROM Item WHERE Type = \'Inventory\' OR Type = \'NonInventory\' ORDER BY Name');
      return response.QueryResponse.Item || [];
    } catch (error) {
      console.error('Error fetching QuickBooks products:', error);
      throw error;
    }
  },

  /**
   * Get pricing information for products
   * @returns {Promise<Array>} Array of pricing objects
   */
  async getPricing() {
    try {
      const response = await this.makeRequest('/query?query=SELECT * FROM Item WHERE Type = \'Inventory\' OR Type = \'NonInventory\' ORDER BY Name');
      const items = response.QueryResponse.Item || [];
      
      return items.map(item => ({
        id: item.Id,
        name: item.Name,
        description: item.Description || '',
        unitPrice: item.UnitPrice || 0,
        purchaseCost: item.PurchaseCost || 0,
        type: item.Type,
        active: item.Active,
        sku: item.Sku || '',
        trackQtyOnHand: item.TrackQtyOnHand || false,
        qtyOnHand: item.QtyOnHand || 0,
        incomeAccountRef: item.IncomeAccountRef,
        expenseAccountRef: item.ExpenseAccountRef,
        assetAccountRef: item.AssetAccountRef
      }));
    } catch (error) {
      console.error('Error fetching QuickBooks pricing:', error);
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
      const billAddr = customer.BillAddr || {};
      const shipAddr = customer.ShipAddr || billAddr;
      
      // Format the billing address as a single string
      const formatAddress = (addr) => {
        if (!addr) return '';
        const parts = [
          addr.Line1,
          addr.Line2,
          addr.City,
          addr.CountrySubDivisionCode,
          addr.PostalCode,
          addr.Country
        ].filter(Boolean);
        return parts.join(', ');
      };
      
      const billAddressStr = formatAddress(billAddr);
      const shipAddressStr = formatAddress(shipAddr);
      
      return {
        name: customer.DisplayName || customer.FullyQualifiedName || '',
        address: billAddressStr,
        city: billAddr.City || '',
        state: billAddr.CountrySubDivisionCode || '',
        zipCode: billAddr.PostalCode || '',
        contactName: customer.FullyQualifiedName || customer.DisplayName || '',
        contactPhone: customer.PrimaryPhone?.FreeFormNumber || '',
        email: customer.PrimaryEmailAddr?.Address || '',
        notes: shipAddressStr !== billAddressStr ? `Ship address: ${shipAddressStr}` : '',
        qbCustomerId: customer.Id,
        createdAt: new Date().toISOString(),
      };
    }).filter(location => location.name && location.address);
  },

  /**
   * Convert QuickBooks products to our product format
   * @param {Array} products - Array of QuickBooks product objects
   * @returns {Array} Formatted product data
   */
  formatProducts(products) {
    if (!Array.isArray(products)) {
      return [];
    }
    
    return products.map(product => ({
      id: product.Id,
      name: product.Name,
      description: product.Description || '',
      price: product.UnitPrice || 0,
      cost: product.PurchaseCost || 0,
      sku: product.Sku || '',
      type: product.Type,
      active: product.Active,
      trackQuantity: product.TrackQtyOnHand || false,
      quantityOnHand: product.QtyOnHand || 0,
      qbProductId: product.Id,
      createdAt: new Date().toISOString(),
    }));
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
   * Import products from QuickBooks
   * @returns {Promise<Array>} Formatted product data
   */
  async importProducts() {
    try {
      const products = await this.getProducts();
      return this.formatProducts(products);
    } catch (error) {
      console.error('Error importing QuickBooks products:', error);
      throw error;
    }
  },

  /**
   * Import pricing from QuickBooks
   * @returns {Promise<Array>} Formatted pricing data
   */
  async importPricing() {
    try {
      return await this.getPricing();
    } catch (error) {
      console.error('Error importing QuickBooks pricing:', error);
      throw error;
    }
  },

  /**
   * Logout and clear tokens
   */
  logout() {
    this._token = null;
    this._refreshToken = null;
    this._tokenExpiry = null;
    this._realmId = null;
    this._autoConnectAttempted = false;
    
    localStorage.removeItem('qb_access_token');
    localStorage.removeItem('qb_refresh_token');
    localStorage.removeItem('qb_token_expiry');
    localStorage.removeItem('qb_realm_id');
  }
};

// Initialize the service automatically
quickBooksService.initialize();

export default quickBooksService; 