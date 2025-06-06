// Utilidad para geocodificar direcciones usando Google Maps API

const GOOGLE_MAPS_API_KEY = 'AIzaSyCwnwpvzKG9cdNGaDavhSL2BqcEnfF9hJA';

/**
 * Obtiene las coordenadas (lat, lng) de una dirección usando Google Maps Geocoding API
 * @param {string} address - Dirección a geocodificar
 * @returns {Promise<{lat: number, lng: number} | null>} Coordenadas o null si no se encuentra
 */
export async function getLatLngFromAddress(address) {
  if (!address) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      console.warn('No se encontró resultado para la dirección:', address, data.status);
      return null;
    }
  } catch (error) {
    console.error('Error geocodificando dirección:', address, error);
    return null;
  }
} 