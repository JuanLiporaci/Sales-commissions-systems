// Configuraciones para optimizar el rendimiento y reducir lecturas a Firebase

export const CacheConfig = {
  // Tiempos de caché
  DEFAULT_CACHE_TTL: 30 * 24 * 60 * 60 * 1000, // 30 días en milisegundos
  AUTH_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  
  // Intervalos de actualización
  AUTH_CHECK_INTERVAL: 30 * 60 * 1000, // 30 minutos
  
  // Claves de caché
  CACHE_PREFIX: 'firestore_cache_',
  CACHE_EXPIRY_PREFIX: 'firestore_expiry_',
  AUTH_CACHE_KEY: 'auth_user_cache',
  AUTH_CACHE_EXPIRY: 'auth_cache_expiry',
  AUTH_LAST_CHECK: 'auth_last_check',
  
  // Configuración de Firebase
  FIREBASE_PERSISTENCE: true, // Habilitar persistencia local de Firestore
  OFFLINE_CAPABILITIES: true, // Habilitar capacidades offline
  
  // Límites de consulta
  DEFAULT_QUERY_LIMIT: 100, // Limitar número de documentos en consultas
};

// Configuraciones de rendimiento general
export const PerformanceConfig = {
  // Deshabilitar logs en producción
  DISABLE_LOGS_IN_PRODUCTION: true,
  
  // Opciones de diagnóstico
  SHOW_DIAGNOSTIC_BADGES: false,
  
  // Configuración del servicio
  ENABLE_FIRESTORE_PERSISTENCE: true,
};

// Configuración para estadísticas
export const StatisticsConfig = {
  // Tiempo mínimo entre actualizaciones forzadas
  MIN_TIME_BETWEEN_UPDATES: 15 * 60 * 1000, // 15 minutos
  
  // Actualización automática
  AUTO_UPDATE_INTERVAL: 6 * 60 * 60 * 1000, // 6 horas
  
  // Límites de datos
  MAX_ITEMS_IN_CHARTS: 10,
  MAX_ITEMS_IN_TABLES: 5,
};

export default {
  CacheConfig,
  PerformanceConfig,
  StatisticsConfig
}; 