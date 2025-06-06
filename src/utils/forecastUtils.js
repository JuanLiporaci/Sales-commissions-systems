import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Utilidades para la gestión de forecasts
 */
export const forecastUtils = {
  /**
   * Marca un forecast como cumplido
   * @param {string} forecastId - ID del forecast
   * @returns {Promise<boolean>} - true si la operación fue exitosa
   */
  async marcarForecastCumplido(forecastId) {
    try {
      console.log(`[ForecastUtils] Marcando forecast ${forecastId} como cumplido`);
      const forecastRef = doc(db, 'forecasts', forecastId);
      
      await updateDoc(forecastRef, {
        cumplido: true
      });
      
      console.log(`[ForecastUtils] Forecast ${forecastId} marcado como cumplido correctamente`);
      return true;
    } catch (error) {
      console.error(`[ForecastUtils] Error al marcar forecast ${forecastId} como cumplido:`, error);
      throw error;
    }
  },
  
  /**
   * Verifica si un forecast está cumplido basado en ventas
   * @param {Object} forecast - Objeto forecast
   * @param {Array} ventas - Array de ventas
   * @returns {boolean} - true si el forecast está cumplido
   */
  verificarForecastCumplido(forecast, ventas) {
    if (!forecast?.productos || forecast.productos.length === 0) return false;
    if (!ventas || ventas.length === 0) return false;
    
    // El forecast ya está marcado como cumplido
    if (forecast.cumplido === true) return true;
    
    // Verificar cada venta para ver si cumple con el forecast
    for (const venta of ventas) {
      // Verificar si es el mismo cliente
      if (venta.cliente !== forecast.cliente) continue;
      
      if (!venta.productos || venta.productos.length === 0) continue;
      
      // Verificar si todos los productos del forecast están en la venta
      const todosCumplidos = forecast.productos.every(prodForecast => {
        const productoEnVenta = venta.productos.some(prodVenta => {
          const coincideCode = prodVenta.code === prodForecast.code;
          const cantidadSuficiente = prodVenta.cantidad >= (prodForecast.cantidad || 1);
          return coincideCode && cantidadSuficiente;
        });
        
        return productoEnVenta;
      });
      
      if (todosCumplidos) return true;
    }
    
    return false;
  },
  
  /**
   * Actualiza el estado de cumplimiento de un forecast en Firestore
   * @param {Object} forecast - Objeto forecast
   * @param {boolean} cumplido - Estado de cumplimiento
   * @returns {Promise<boolean>} - true si la operación fue exitosa
   */
  async actualizarEstadoCumplimiento(forecast, cumplido) {
    try {
      console.log(`[ForecastUtils] Actualizando estado de cumplimiento del forecast ${forecast.id} a ${cumplido}`);
      const forecastRef = doc(db, 'forecasts', forecast.id);
      
      await updateDoc(forecastRef, {
        cumplido: cumplido
      });
      
      console.log(`[ForecastUtils] Estado de cumplimiento actualizado correctamente`);
      return true;
    } catch (error) {
      console.error(`[ForecastUtils] Error al actualizar estado de cumplimiento:`, error);
      throw error;
    }
  }
}; 