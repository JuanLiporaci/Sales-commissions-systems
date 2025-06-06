import React, { useEffect, useRef, useState } from 'react';
import { Box, Heading, Spinner, Center, useColorModeValue, Badge, Text } from '@chakra-ui/react';
import { where, orderBy } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { firestoreService } from '../lib/FirestoreService';
import type { Chart } from 'chart.js';

// Claves para caché
const CACHE_KEY_VENTAS_TENDENCIA = 'ventas_tendencia_cache';
const CACHE_EXPIRY_TENDENCIA = 'ventas_tendencia_expiry';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos (antes 30 minutos)

interface Venta {
  id: string;
  cliente: string;
  monto: number;
  fecha: string;
  fechaRegistro: string;
  productos: any[];
  [key: string]: any;
}

const VentasTendenciaChart = () => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ventasPorMes, setVentasPorMes] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<{reads: number, cached: number}>({reads: 0, cached: 0});
  const { user } = useAuth();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Función para guardar datos en caché
  const guardarCache = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(CACHE_EXPIRY_TENDENCIA, JSON.stringify(Date.now() + CACHE_TTL));
  };

  // Función para leer datos de la caché
  const leerCache = (key: string) => {
    const data = localStorage.getItem(key);
    if (!data) return null;

    const expiry = localStorage.getItem(CACHE_EXPIRY_TENDENCIA);
    if (expiry && parseInt(expiry) < Date.now()) {
      localStorage.removeItem(key);
      localStorage.removeItem(CACHE_EXPIRY_TENDENCIA);
      return null;
    }

    return JSON.parse(data);
  };

  // Agrupar ventas por mes
  const agruparVentasPorMes = (ventas: Venta[]) => {
    const ventasPorMes = ventas.reduce((acc, venta) => {
      const fecha = new Date(venta.fechaRegistro);
      const mes = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
      
      if (!acc[mes]) {
        acc[mes] = 0;
      }
      
      acc[mes] += venta.monto || 0;
      return acc;
    }, {} as Record<string, number>);
    
    return ventasPorMes;
  };

  // Cargar datos de ventas usando FirestoreService
  const cargarDatos = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    
    try {
      // Cargar ventas mediante FirestoreService
      const ventasConstraints = [
        where('usuarioEmail', '==', user?.email),
        orderBy('fechaRegistro', 'asc')
      ];
      
      const ventasData = await firestoreService.getCollection('ventas', ventasConstraints, {
        cacheKey: `ventas_tendencia_${user.email}`
      });
      
      const datosAgrupados = agruparVentasPorMes(ventasData as Venta[]);
      
      // Guardar datos y estadísticas
      setVentasPorMes(datosAgrupados);
      setStats(firestoreService.getRequestStats());
      
    } catch (err) {
      console.error('Error cargando datos de ventas:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Función para crear el gráfico
  const crearGrafico = async () => {
    try {
      // Limpiar gráfico existente
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
      
      if (!chartRef.current || Object.keys(ventasPorMes).length === 0) return;
      
      // Importar Chart.js dinámicamente
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        console.log('Creando gráfico de tendencia de ventas');
        
        // Preparar datos para el gráfico
        const meses = Object.keys(ventasPorMes).sort((a, b) => {
          const [mesA, yearA] = a.split('/');
          const [mesB, yearB] = b.split('/');
          return new Date(parseInt(yearA), parseInt(mesA) - 1).getTime() - 
                 new Date(parseInt(yearB), parseInt(mesB) - 1).getTime();
        });
        
        const montos = meses.map(mes => ventasPorMes[mes]);
        
        // Crear el gráfico
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: meses,
            datasets: [{
              label: 'Ventas Mensuales',
              data: montos,
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              pointBackgroundColor: 'rgb(75, 192, 192)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(75, 192, 192)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Tendencia de Ventas Mensuales'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN' 
                      }).format(context.parsed.y);
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '$' + value;
                  }
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('Error creando gráfico:', err);
      setError(true);
    }
  };

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    cargarDatos();
  }, [user?.email]);

  // Crear gráfico cuando se cargan los datos
  useEffect(() => {
    if (!loading && !error && Object.keys(ventasPorMes).length > 0) {
      crearGrafico();
    }
    
    // Limpiar el gráfico cuando el componente se desmonte
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [ventasPorMes, loading, error]);

  return (
    <Box 
      p={4} 
      shadow="md" 
      border="1px" 
      borderColor={borderColor} 
      borderRadius="md" 
      bg={bgColor}
      height="300px"
    >
      <Heading size="md" mb={2}>Tendencia de Ventas</Heading>
      
      {/* Mostrar las estadísticas de lectura */}
      <Box mb={3}>
        <Badge colorScheme="green" mr={2}>Cache: {stats.cached}</Badge>
        <Badge colorScheme="red">Firebase: {stats.reads}</Badge>
      </Box>
      
      {loading ? (
        <Center height="200px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : error ? (
        <Center height="200px">
          <Heading size="sm" color="red.500">Error al cargar los datos de ventas</Heading>
        </Center>
      ) : Object.keys(ventasPorMes).length === 0 ? (
        <Center height="200px">
          <Heading size="sm" color="gray.500">No hay datos de ventas disponibles</Heading>
        </Center>
      ) : (
        <Box height="210px">
          <canvas ref={chartRef} />
        </Box>
      )}
    </Box>
  );
};

export default VentasTendenciaChart; 