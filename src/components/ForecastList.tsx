import React, { useEffect, useState } from 'react';
import { Box, Text, Badge, Spinner, VStack, Button, useToast, HStack, IconButton } from '@chakra-ui/react';
import { where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { firestoreService } from '../lib/FirestoreService';
import { FiCheck, FiRefreshCw } from 'react-icons/fi';
import { forecastsService } from '../services/forecasts';

// Definir interfaz para el tipo de forecast
interface Forecast {
  id: string;
  cliente: string;
  cumplido: boolean;
  productos: {
    code: string;
    description: string;
    cantidad: number;
    [key: string]: any;
  }[];
  [key: string]: any;
}

// Definir interfaz para los productos de la venta
interface Venta {
  id: string;
  cliente: string;
  productos: {
    code: string;
    cantidad: number;
    [key: string]: any;
  }[];
  [key: string]: any;
}

const ForecastList = () => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{reads: number, cached: number}>({reads: 0, cached: 0});
  const { user } = useAuth();
  const toast = useToast();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const cargarDatos = async (forzarActualizacion = false) => {
    if (!user?.email) {
      console.log('No hay usuario autenticado');
      return;
    }

    setLoading(true);
    
    try {
      // Opciones para el servicio
      const options = {
        bypassCache: forzarActualizacion
      };
      
      // 1. Cargar forecasts usando el servicio
      const forecastsConstraints = [
        where('usuarioEmail', '==', user?.email)
      ];
      
      const forecastsData = await firestoreService.getCollection(
        'forecasts', 
        forecastsConstraints, 
        {
          ...options,
          cacheKey: `forecastlist_forecasts_${user.email}`
        }
      ) as Forecast[];
      
      // 2. Cargar ventas usando el servicio
      const ventasConstraints = [
        where('usuarioEmail', '==', user?.email)
      ];
      
      const ventasData = await firestoreService.getCollection(
        'ventas', 
        ventasConstraints, 
        {
          ...options,
          cacheKey: `forecastlist_ventas_${user.email}`
        }
      ) as Venta[];
      
      // Guardar en estado
      setForecasts(forecastsData);
      setVentas(ventasData);
      setLastUpdate(new Date());
      setStats(firestoreService.getRequestStats());
      
      // 3. Verificar y actualizar los forecasts cumplidos (solo si forzamos actualización)
      if (forzarActualizacion) {
        let forecastsActualizados = 0;
        
        for (const forecast of forecastsData) {
          if (forecast.cumplido === true) continue; // Saltamos los ya cumplidos
          
          const estaCumplido = forecastCumplido(forecast, ventasData);
          
          // Si el forecast está cumplido y no está marcado como tal en Firestore
          if (estaCumplido && forecast.cumplido === false) {
            try {
              console.log(`Actualizando forecast ${forecast.id} a cumplido = true`);
              // Asegurarnos de usar correctamente la referencia del documento
              await updateDoc(doc(db, 'forecasts', forecast.id), {
                cumplido: true
              });
              forecastsActualizados++;
              
              // Actualizar localmente
              forecast.cumplido = true;
            } catch (error) {
              console.error(`Error al actualizar el forecast ${forecast.id}:`, error);
            }
          }
        }
        
        if (forecastsActualizados > 0) {
          toast({
            title: 'Pronósticos actualizados',
            description: `Se han marcado ${forecastsActualizados} pronósticos como cumplidos.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          // Actualizar el estado con los forecasts actualizados
          setForecasts([...forecastsData]);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al cargar los pronósticos.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar datos solo cuando el usuario cambia o al montar el componente
    if (user?.email) {
      cargarDatos(false); // No forzar actualización al cargar inicialmente
    }
  }, [user?.email]); // Dependencia específica al email del usuario

  // Esta función determina si un forecast está cumplido basado en las ventas
  function forecastCumplido(forecast: Forecast, ventas: Venta[]) {
    if (!forecast.productos || forecast.productos.length === 0) return false;
    
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
  }

  // Función para marcar manualmente un forecast como cumplido
  const marcarComoCumplido = async (forecast: Forecast) => {
    if (forecast.cumplido) {
      toast({
        title: 'Información',
        description: 'Este pronóstico ya está marcado como cumplido.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoading(true);
      const resultado = await forecastsService.marcarForecastCumplido(forecast.id);
      
      if (resultado) {
        // Actualizar el estado local
        setForecasts(prevForecasts => 
          prevForecasts.map(f => 
            f.id === forecast.id ? { ...f, cumplido: true } : f
          )
        );
        
        toast({
          title: 'Éxito',
          description: 'Pronóstico marcado como cumplido correctamente.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo marcar el pronóstico como cumplido.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error al marcar forecast como cumplido:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al procesar la solicitud.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderizan los forecasts, mostrando si están cumplidos o no
  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="xl" fontWeight="bold">
          Pronósticos Activos
        </Text>
        <Box>
          <HStack spacing={2} mb={1}>
            <Badge colorScheme="green">Desde caché: {stats.cached}</Badge>
            <Badge colorScheme="red">Desde Firebase: {stats.reads}</Badge>
          </HStack>
          <Box textAlign="right">
            {lastUpdate && (
              <Text fontSize="xs" color="gray.500" mr={2} display="inline">
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
            <Button 
              size="sm" 
              colorScheme="blue" 
              onClick={() => cargarDatos(true)} // Forzar actualización
              isLoading={loading}
            >
              Actualizar
            </Button>
          </Box>
        </Box>
      </Box>
      
      {loading ? (
        <Box textAlign="center" p={4}>
          <Spinner />
          <Text mt={2}>Cargando pronósticos...</Text>
        </Box>
      ) : forecasts.length === 0 ? (
        <Text>No hay pronósticos registrados.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {forecasts.map(forecast => {
            // Verificar si el forecast está cumplido
            const cumplido = forecast.cumplido || forecastCumplido(forecast, ventas);
            
            return (
              <Box 
                key={forecast.id} 
                p={4} 
                borderRadius="md" 
                border="1px" 
                borderColor={cumplido ? "green.200" : "gray.200"}
                bg={cumplido ? "green.50" : "white"}
              >
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Text fontWeight="bold">{forecast.cliente}</Text>
                  <HStack>
                    {!forecast.cumplido && (
                      <IconButton
                        aria-label="Marcar como cumplido"
                        icon={<FiCheck />}
                        size="sm"
                        colorScheme="green"
                        onClick={() => marcarComoCumplido(forecast)}
                        title="Marcar manualmente como cumplido"
                      />
                    )}
                    <Badge colorScheme={cumplido ? "green" : "yellow"}>
                      {cumplido ? "Cumplido" : "Pendiente"}
                    </Badge>
                  </HStack>
                </Box>
                
                <Text fontSize="sm" mb={2}>Productos:</Text>
                <VStack align="stretch" pl={2}>
                  {forecast.productos.map((producto, index) => (
                    <Text key={index} fontSize="sm">
                      • {producto.description} ({producto.cantidad} unidades)
                    </Text>
                  ))}
                </VStack>
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
};

export default ForecastList; 