/**
 * Utility to handle importing data from Google Sheets
 * 
 * This utility provides methods to process CSV data (which can be exported from Google Sheets)
 * and convert it into a structured format for the application.
 */

/**
 * Parse CSV data into an array of objects
 * @param {string} csvString - CSV data as a string
 * @param {Object} options - Parse options
 * @returns {Array} Array of objects with keys from the CSV header
 */
export const parseCSV = (csvString, options = {}) => {
  if (!csvString || typeof csvString !== 'string') {
    throw new Error('Invalid CSV data');
  }

  const { hasHeader = true, delimiter = ',' } = options;
  const lines = csvString.split(/\r?\n/);
  const result = [];
  
  if (!lines || lines.length < 1) {
    return result;
  }
  
  // Extract header row if present
  const headerRow = hasHeader && lines.length > 0 ? lines.shift() : null;
  if (!headerRow) {
    return result;
  }
  
  const headers = headerRow ? headerRow.split(delimiter) : [];
  
  // Create property names if no headers are provided
  const propNames = headers.length > 0 
    ? headers.map(h => h && h.trim() || '')
    : (lines[0] && lines[0].split(delimiter).length > 0 
       ? Array(lines[0].split(delimiter).length).fill(0).map((_, i) => `field${i}`)
       : []);
  
  if (propNames.length === 0) {
    return result;
  }
  
  // Process each data row
  for (const line of lines) {
    if (!line || !line.trim()) continue; // Skip empty lines
    
    // Handle quoted values (which might contain commas)
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    const item = {};
    propNames.forEach((prop, index) => {
      if (!prop) return; // Skip empty property names
      // Clean up value and handle empty cells
      const value = index < values.length ? values[index].replace(/^"|"$/g, '') : '';
      item[prop] = value;
    });
    
    result.push(item);
  }
  
  return result;
};

/**
 * Process location data from parsed CSV data
 * @param {Array} parsedData - The parsed CSV data
 * @returns {Array} Formatted location data
 */
export const processLocationData = (parsedData) => {
  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return [];
  }
  
  return parsedData.map(item => {
    if (!item) return null;
    
    // Detect format: QuickBooks format has specific columns, generic format might have different ones
    const isQuickBooksFormat = item['Customer full name'] !== undefined || item['Bill address'] !== undefined;
    
    let name = '';
    let address = '';
    let city = '';
    let state = '';
    let zipCode = '';
    let contactName = '';
    let contactPhone = '';
    let email = '';
    let notes = '';

    if (isQuickBooksFormat) {
      // Handle QuickBooks format
      name = item['Customer full name'] || '';
      address = item['Bill address'] || '';
      contactName = item['Full name'] || item['Customer full name'] || '';
      contactPhone = item['Phone numbers'] || '';
      email = item['Email'] || '';
      notes = item['Ship address'] ? `Ship address: ${item['Ship address']}` : '';
      
      // Try to extract city, state, zip from address
      if (address) {
        const addressParts = address.split(',');
        if (addressParts.length >= 3) {
          // Last part might contain State + Zip
          const stateZipPart = addressParts[addressParts.length - 2].trim();
          const stateZipMatch = stateZipPart && stateZipPart.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
          
          if (stateZipMatch) {
            state = stateZipMatch[1];
            zipCode = stateZipMatch[2];
          }
          
          // City is usually before state/zip
          city = addressParts[addressParts.length - 3].trim();
        }
      }
    } else {
      // Handle generic format
      name = item.name || item.cliente || item.customer || item.nombre || '';
      address = item.address || item.direccion || item.domicilio || '';
      city = item.city || item.ciudad || '';
      state = item.state || item.estado || '';
      zipCode = item.zipCode || item.zip || item.codigoPostal || item['código postal'] || '';
      contactName = item.contactName || item.contact || item.contacto || item.nombre || '';
      contactPhone = item.contactPhone || item.phone || item.telefono || item.teléfono || '';
      email = item.email || item.correo || '';
      notes = item.notes || item.notas || '';
    }
    
    return {
      name,
      address,
      city,
      state,
      zipCode,
      contactName,
      contactPhone,
      email,
      notes,
      createdAt: new Date().toISOString(),
    };
  }).filter(location => location && location.name && location.address); // Filter out entries without name or address
};

/**
 * Convert a file to text
 * @param {File} file - The file object to read
 * @returns {Promise<string>} Promise resolving to the file contents as string
 */
export const fileToText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}; 