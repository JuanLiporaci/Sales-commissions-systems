import { useState, useEffect, useCallback } from 'react';
import { where, orderBy, QueryConstraint } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { firestoreService } from '../lib/FirestoreService';

// Hook personalizado para acceder a datos de Firestore con caché
export const useFirestoreData = <T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: {
    cacheKey?: string;
    ttl?: number;
    forceRefresh?: boolean;
  } = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { user } = useAuth();

  // Función para cargar datos
  const loadData = useCallback(
    async (forceRefresh = false) => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Generar clave de caché personalizada si no se proporciona
        const cacheKey = options.cacheKey || `${collectionName}_${user.email}`;

        // Obtener datos usando FirestoreService
        const result = await firestoreService.getCollection(
          collectionName,
          constraints,
          {
            cacheKey,
            ttl: options.ttl,
            bypassCache: forceRefresh || options.forceRefresh
          }
        );

        setData(result as T[]);
        setLastUpdate(new Date());
      } catch (err) {
        console.error(`Error cargando datos de ${collectionName}:`, err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setLoading(false);
      }
    },
    [user?.email, collectionName, constraints, options]
  );

  // Cargar datos al montar o cuando cambien dependencias
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Retornar datos, estado y funciones
  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh: (force = true) => loadData(force),
    stats: firestoreService.getRequestStats()
  };
};

// Hook específico para ventas
export const useVentas = (options = {}) => {
  const { user } = useAuth();
  
  const constraints = user?.email
    ? [
        where('usuarioEmail', '==', user.email),
        orderBy('fechaRegistro', 'desc')
      ]
    : [];
  
  return useFirestoreData('ventas', constraints, {
    cacheKey: user?.email ? `ventas_${user.email}` : undefined,
    ...options
  });
};

// Hook específico para forecasts
export const useForecasts = (options = {}) => {
  const { user } = useAuth();
  
  const constraints = user?.email
    ? [
        where('usuarioEmail', '==', user.email),
        orderBy('fechaRegistro', 'desc')
      ]
    : [];
  
  return useFirestoreData('forecasts', constraints, {
    cacheKey: user?.email ? `forecasts_${user.email}` : undefined,
    ...options
  });
};

// Hook para clientes/ubicaciones
export const useClientes = (options = {}) => {
  const { user } = useAuth();
  
  const constraints = user?.email
    ? [
        where('createdBy', '==', user.email)
      ]
    : [];
  
  return useFirestoreData('delivery_locations', constraints, {
    cacheKey: user?.email ? `clientes_${user.email}` : undefined,
    ...options
  });
};

export default useFirestoreData; 