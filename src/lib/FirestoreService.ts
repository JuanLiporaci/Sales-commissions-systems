import { collection, getDocs, query, where, orderBy, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from './firebase';

// Configuración de caché
const CACHE_PREFIX = 'firestore_cache_';
const CACHE_EXPIRY_PREFIX = 'firestore_expiry_';
const DEFAULT_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos (aumentado de 7 días)

// Contador de solicitudes (solo para desarrollo)
let requestCounter = {
  reads: 0,
  cached: 0
};

// Tipo para las opciones de caché
interface CacheOptions {
  ttl?: number;
  bypassCache?: boolean;
  cacheKey?: string;
}

// Servicio de Firestore con caché
class FirestoreService {
  // Guardar datos en caché
  private setCache(key: string, data: any, ttl: number = DEFAULT_CACHE_TTL): void {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      const expiryTime = Date.now() + ttl;
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(expiryKey, JSON.stringify(expiryTime));
      
      console.log(`[FirestoreService] Datos guardados en caché: ${key}`);
    } catch (error) {
      console.error('[FirestoreService] Error guardando caché:', error);
      // Si hay error al guardar en caché (ej. localStorage lleno), limpiamos caché antigua
      this.clearOldCache();
    }
  }
  
  // Leer datos de caché
  private getCache(key: string): any {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      const expiry = localStorage.getItem(expiryKey);
      
      if (!cachedData || !expiry) return null;
      
      const expiryTime = JSON.parse(expiry);
      
      // Verificar si la caché ha expirado
      if (expiryTime < Date.now()) {
        // Caché expirada, limpiar
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(expiryKey);
        return null;
      }
      
      // Incrementamos contador de cachés utilizadas
      requestCounter.cached++;
      console.log(`[FirestoreService] Datos obtenidos de caché: ${key}`);
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('[FirestoreService] Error leyendo caché:', error);
      return null;
    }
  }
  
  // Limpiar caché antigua (cuando localStorage está lleno)
  private clearOldCache(): void {
    try {
      // Obtener todas las claves de localStorage
      const allKeys = Object.keys(localStorage);
      
      // Filtrar solo las claves de nuestra caché
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
      const expiryKeys = allKeys.filter(key => key.startsWith(CACHE_EXPIRY_PREFIX));
      
      // Ordenar por expiración y eliminar las más antiguas (25%)
      const expiryData: {key: string, expiry: number}[] = [];
      
      expiryKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          expiryData.push({
            key: key.replace(CACHE_EXPIRY_PREFIX, CACHE_PREFIX),
            expiry: JSON.parse(data)
          });
        }
      });
      
      // Ordenar por fecha de expiración (más antiguas primero)
      expiryData.sort((a, b) => a.expiry - b.expiry);
      
      // Eliminar el 25% más antiguo
      const toRemove = Math.ceil(expiryData.length * 0.25);
      
      for (let i = 0; i < toRemove; i++) {
        if (expiryData[i]) {
          const cacheKey = expiryData[i].key;
          const expiryKey = cacheKey.replace(CACHE_PREFIX, CACHE_EXPIRY_PREFIX);
          
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(expiryKey);
          
          console.log(`[FirestoreService] Caché antigua eliminada: ${cacheKey}`);
        }
      }
    } catch (error) {
      console.error('[FirestoreService] Error limpiando caché antigua:', error);
    }
  }
  
  // Obtener documentos de una colección con caché
  async getCollection(
    collectionName: string, 
    constraints: QueryConstraint[] = [],
    options: CacheOptions = {}
  ): Promise<DocumentData[]> {
    const {
      ttl = DEFAULT_CACHE_TTL,
      bypassCache = false,
      cacheKey = this.generateCacheKey(collectionName, constraints)
    } = options;
    
    // Si no se quiere evitar la caché, intentamos obtener datos de allí
    if (!bypassCache) {
      const cachedData = this.getCache(cacheKey);
      if (cachedData) return cachedData;
    }
    
    try {
      // Incrementamos contador de lecturas
      requestCounter.reads++;
      console.log(`[FirestoreService] Lectura Firestore: ${collectionName}`, requestCounter);
      
      // Crear la consulta
      const collectionRef = collection(db, collectionName);
      const q = constraints.length > 0 
        ? query(collectionRef, ...constraints)
        : query(collectionRef);
      
      // Ejecutar la consulta
      const snapshot = await getDocs(q);
      
      // Convertir a array de documentos
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Guardar en caché
      this.setCache(cacheKey, documents, ttl);
      
      return documents;
    } catch (error) {
      console.error(`[FirestoreService] Error obteniendo colección ${collectionName}:`, error);
      throw error;
    }
  }
  
  // Generar clave de caché basada en colección y restricciones
  private generateCacheKey(collectionName: string, constraints: QueryConstraint[]): string {
    try {
      // Intentar generar una clave más descriptiva basada en las restricciones
      let key = collectionName;
      
      // Extraer información de las restricciones para crear una clave única
      constraints.forEach((constraint: any) => {
        if (constraint.type === 'where' && constraint._field && constraint._op && constraint._value !== undefined) {
          // Para operadores de comparación
          key += `_${constraint._field.toString()}_${constraint._op}_${constraint._value}`;
        } else if (constraint.type === 'orderBy' && constraint._field) {
          // Para ordenamiento
          key += `_orderBy_${constraint._field.toString()}_${constraint._dir || 'asc'}`;
        } else if (constraint.type === 'limit') {
          // Para límites
          key += `_limit_${constraint._limit}`;
        }
      });
      
      return key;
    } catch (error) {
      // Si hay algún error en la generación de la clave, volver al método simple
      console.warn('[FirestoreService] Error generando clave de caché:', error);
      return `${collectionName}_${constraints.length}`;
    }
  }
  
  // Precarga colecciones comunes para un usuario (reduce lecturas posteriores)
  async preloadUserData(email: string): Promise<void> {
    if (!email) return;
    
    try {
      console.log('[FirestoreService] Iniciando precarga de datos para:', email);
      
      // Colecciones a precargar con sus restricciones
      const collections = [
        {
          name: 'ventas',
          constraints: [
            where('usuarioEmail', '==', email),
            orderBy('fechaRegistro', 'desc')
          ],
          cacheKey: `ventas_${email}`
        },
        {
          name: 'forecasts',
          constraints: [
            where('usuarioEmail', '==', email)
          ],
          cacheKey: `forecasts_${email}`
        }
      ];
      
      // Ejecutar todas las precarga en paralelo
      await Promise.all(collections.map(col => 
        this.getCollection(col.name, col.constraints, {
          cacheKey: col.cacheKey,
          ttl: DEFAULT_CACHE_TTL
        })
      ));
      
      console.log('[FirestoreService] Precarga completada para:', email);
    } catch (error) {
      console.error('[FirestoreService] Error en precarga:', error);
    }
  }
  
  // Obtener estadísticas de uso
  getRequestStats(): typeof requestCounter {
    return { ...requestCounter };
  }
  
  // Resetear contadores
  resetStats(): void {
    requestCounter = { reads: 0, cached: 0 };
  }
}

// Exportar una única instancia del servicio
export const firestoreService = new FirestoreService(); 