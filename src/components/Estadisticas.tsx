import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, 
  Heading, 
  Text, 
  Flex, 
  SimpleGrid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText,
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Button,
  useToast,
  Spinner,
  Select,
  HStack,
  Badge
} from '@chakra-ui/react';
import { where, orderBy } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { firestoreService } from '../lib/FirestoreService';

// Importar React-ChartJS-2
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Registrar componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// Añadir esto para verificar que ChartJS se haya registrado correctamente
console.log('ChartJS registrado:', ChartJS);

// Claves para caché local (serán reemplazadas por FirestoreService)
const CACHE_KEY_VENTAS = 'estadisticas_ventas_cache';
const CACHE_KEY_FORECASTS = 'estadisticas_forecasts_cache';
const CACHE_EXPIRY = 'estadisticas_cache_expiry';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos (antes 7 días)

interface Venta {
  id: string;
  cliente: string;
  monto: number;
  fecha: string;
  fechaRegistro: string;
  productos: any[];
  [key: string]: any;
}

interface Forecast {
  id: string;
  cliente: string;
  cumplido: boolean;
  fechaRegistro: string;
  productos: any[];
  [key: string]: any;
}

// Función para formatear fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// Función para agrupar ventas por cliente
const agruparPorCliente = (ventas: Venta[]) => {
  const agrupado: any = ventas.reduce((acc: any, venta) => {
    const cliente = venta.cliente || 'Sin Cliente';
    if (!acc[cliente]) {
      acc[cliente] = {
        cliente,
        montoTotal: 0,
        cantidadVentas: 0
      };
    }
    acc[cliente].montoTotal += venta.monto || 0;
    acc[cliente].cantidadVentas += 1;
    return acc;
  }, {});
  
  return Object.values(agrupado);
};

// Función para agrupar ventas por mes
const agruparPorMes = (ventas: Venta[]) => {
  const agrupado: any = ventas.reduce((acc: any, venta) => {
    const fecha = new Date(venta.fechaRegistro);
    const mes = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
    
    if (!acc[mes]) {
      acc[mes] = {
        mes,
        montoTotal: 0,
        cantidadVentas: 0
      };
    }
    
    acc[mes].montoTotal += venta.monto || 0;
    acc[mes].cantidadVentas += 1;
    return acc;
  }, {});
  
  return Object.values(agrupado).sort((a: any, b: any) => {
    const [mesA, añoA] = a.mes.split('/');
    const [mesB, añoB] = b.mes.split('/');
    return new Date(parseInt(añoA), parseInt(mesA) - 1).getTime() - 
           new Date(parseInt(añoB), parseInt(mesB) - 1).getTime();
  });
};

// Función para calcular tasa de cumplimiento de forecasts
const calcularTasaCumplimiento = (forecasts: Forecast[]) => {
  if (forecasts.length === 0) return 0;
  
  const cumplidos = forecasts.filter(f => f.cumplido).length;
  return (cumplidos / forecasts.length) * 100;
};

const Estadisticas = () => {
  console.log('Renderizando componente Estadisticas');
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('todos');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState<{reads: number, cached: number}>({reads: 0, cached: 0});
  const { user } = useAuth();
  const toast = useToast();
  
  // Memoizar la función cargarDatos para evitar recrearla en cada render
  const cargarDatos = useCallback(async (forzarActualizacion = false) => {
    console.log('cargarDatos iniciado, forzarActualizacion:', forzarActualizacion);
    if (!user?.email) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Opciones para el servicio
      const options = {
        bypassCache: forzarActualizacion
      };
      
      // Usar la función de precarga que optimiza las lecturas
      if (forzarActualizacion) {
        await firestoreService.preloadUserData(user.email);
      }
      
      // 1. Cargar ventas usando el servicio
      const ventasConstraints = [
        where('usuarioEmail', '==', user?.email),
        orderBy('fechaRegistro', 'desc')
      ];
      
      const ventasData = await firestoreService.getCollection('ventas', ventasConstraints, {
        ...options,
        cacheKey: `ventas_${user.email}`
      });
      
      // 2. Cargar forecasts usando el servicio
      const forecastsConstraints = [
        where('usuarioEmail', '==', user?.email)
      ];
      
      const forecastsData = await firestoreService.getCollection('forecasts', forecastsConstraints, {
        ...options,
        cacheKey: `forecasts_${user.email}`
      });
      
      // Guardar en estado
      setVentas(ventasData as Venta[]);
      setForecasts(forecastsData as Forecast[]);
      setLastUpdate(new Date());
      
      // Actualizar estadísticas
      setStats(firestoreService.getRequestStats());
      
      if (forzarActualizacion) {
        toast({
          title: 'Datos actualizados',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de estadísticas.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.email, toast]);
  
  useEffect(() => {
    console.log('useEffect activado, cargando datos...');
    // Solo cargamos datos si no hay datos en caché o si es la primera vez
    const loadData = async () => {
      // Intentar usar datos ya precargados primero
      try {
        const ventasData = await firestoreService.getCollection(
          'ventas', 
          [where('usuarioEmail', '==', user?.email)], 
          {cacheKey: `ventas_${user?.email}`}
        );
        
        const forecastsData = await firestoreService.getCollection(
          'forecasts', 
          [where('usuarioEmail', '==', user?.email)], 
          {cacheKey: `forecasts_${user?.email}`}
        );
        
        if (ventasData.length > 0 || forecastsData.length > 0) {
          setVentas(ventasData as Venta[]);
          setForecasts(forecastsData as Forecast[]);
          setLoading(false);
          setLastUpdate(new Date());
          setStats(firestoreService.getRequestStats());
          return;
        }
        
        // Si no hay datos en caché, cargar desde Firebase
        await cargarDatos(false);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        await cargarDatos(false);
      }
    };
    
    loadData();
  }, [user?.email, cargarDatos]);
  
  // Filtrar datos por periodo
  const filtrarPorPeriodo = (data: any[]) => {
    if (periodo === 'todos') return data;
    
    const ahora = new Date();
    const inicio = new Date();
    
    switch (periodo) {
      case 'semana':
        inicio.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        inicio.setMonth(ahora.getMonth() - 1);
        break;
      case 'trimestre':
        inicio.setMonth(ahora.getMonth() - 3);
        break;
      case 'año':
        inicio.setFullYear(ahora.getFullYear() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.fechaRegistro) >= inicio);
  };
  
  // Datos filtrados
  const ventasFiltradas = filtrarPorPeriodo(ventas);
  const forecastsFiltrados = filtrarPorPeriodo(forecasts);
  
  // Datos para gráficos
  const clientesAgrupados = agruparPorCliente(ventasFiltradas);
  const ventasPorMes = agruparPorMes(ventasFiltradas);
  
  // Datos para gráfico de barras - Ventas por Cliente
  const datosVentasPorCliente = {
    labels: clientesAgrupados.map((grupo: any) => grupo.cliente),
    datasets: [
      {
        label: 'Monto de Ventas',
        data: clientesAgrupados.map((grupo: any) => grupo.montoTotal),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Datos para gráfico de línea - Ventas por Mes
  const datosVentasPorMes = {
    labels: ventasPorMes.map((grupo: any) => grupo.mes),
    datasets: [
      {
        label: 'Monto Total',
        data: ventasPorMes.map((grupo: any) => grupo.montoTotal),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };
  
  // Datos para gráfico circular - Cumplimiento de Forecasts
  const datosCumplimientoForecasts = {
    labels: ['Cumplidos', 'Pendientes'],
    datasets: [
      {
        data: [
          forecastsFiltrados.filter(f => f.cumplido).length,
          forecastsFiltrados.filter(f => !f.cumplido).length,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Calcular estadísticas generales
  const estadisticas = {
    totalVentas: ventasFiltradas.length,
    montoTotal: ventasFiltradas.reduce((sum, v) => sum + (v.monto || 0), 0),
    promedioPorVenta: ventasFiltradas.length > 0 
      ? ventasFiltradas.reduce((sum, v) => sum + (v.monto || 0), 0) / ventasFiltradas.length 
      : 0,
    totalForecasts: forecastsFiltrados.length,
    forecastsCumplidos: forecastsFiltrados.filter(f => f.cumplido).length,
    tasaCumplimiento: calcularTasaCumplimiento(forecastsFiltrados),
  };

  // Después de preparar los datos para los gráficos
  console.log('Datos para gráficos:', {
    clientesAgrupados,
    ventasPorMes,
    datosVentasPorCliente,
    datosVentasPorMes,
    datosCumplimientoForecasts
  });
  
  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="lg">Estadísticas</Heading>
        <HStack spacing={2}>
          <Select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value)}
            w="180px"
          >
            <option value="todos">Todo el tiempo</option>
            <option value="semana">Última semana</option>
            <option value="mes">Último mes</option>
            <option value="trimestre">Último trimestre</option>
            <option value="año">Último año</option>
          </Select>
          <Box>
            {lastUpdate && (
              <Text fontSize="xs" color="gray.500" mr={2} display="inline">
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => cargarDatos(true)}
              isLoading={loading}
            >
              Actualizar
            </Button>
          </Box>
        </HStack>
      </Flex>
      
      {loading ? (
        <Flex justify="center" align="center" direction="column" h="400px">
          <Spinner size="xl" />
          <Text mt={4}>Cargando estadísticas...</Text>
        </Flex>
      ) : (
        <>
          {/* Añadir esto como un mensaje de diagnóstico */}
          <Box p={4} mb={4} bg="yellow.100" borderRadius="md">
            <Text>Diagnóstico: {ventas.length} ventas y {forecasts.length} forecasts cargados.</Text>
            <Text>Periodo: {periodo}, Filtrados: {ventasFiltradas.length} ventas, {forecastsFiltrados.length} forecasts</Text>
            <Flex mt={2}>
              <Badge colorScheme="red" mr={2}>Lecturas Firestore: {stats.reads}</Badge>
              <Badge colorScheme="green">Lecturas desde caché: {stats.cached}</Badge>
            </Flex>
          </Box>
        
          {/* Tarjetas de Resumen */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
              <StatLabel>Total de Ventas</StatLabel>
              <StatNumber>${estadisticas.montoTotal.toFixed(2)}</StatNumber>
              <StatHelpText>{estadisticas.totalVentas} operaciones</StatHelpText>
            </Stat>
            
            <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
              <StatLabel>Promedio por Venta</StatLabel>
              <StatNumber>${estadisticas.promedioPorVenta.toFixed(2)}</StatNumber>
              <StatHelpText>Por operación</StatHelpText>
            </Stat>
            
            <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
              <StatLabel>Tasa de Cumplimiento</StatLabel>
              <StatNumber>{estadisticas.tasaCumplimiento.toFixed(1)}%</StatNumber>
              <StatHelpText>{estadisticas.forecastsCumplidos} de {estadisticas.totalForecasts} pronósticos</StatHelpText>
            </Stat>
          </SimpleGrid>
          
          {/* Gráficos */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
            {/* Verificar si hay datos suficientes para el gráfico */}
            {clientesAgrupados.length > 0 ? (
              <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" height="300px">
                <Heading size="sm" mb={4}>Ventas por Cliente</Heading>
                <Box height="250px">
                  <Bar 
                    data={datosVentasPorCliente} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" height="300px">
                <Heading size="sm" mb={4}>Ventas por Cliente</Heading>
                <Flex justify="center" align="center" h="full">
                  <Text>No hay suficientes datos para mostrar el gráfico</Text>
                </Flex>
              </Box>
            )}
            
            <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" height="300px">
              <Heading size="sm" mb={4}>Evolución de Ventas</Heading>
              <Box height="250px">
                <Line 
                  data={datosVentasPorMes} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </Box>
            </Box>
            
            <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" height="300px">
              <Heading size="sm" mb={4}>Cumplimiento de Pronósticos</Heading>
              <Flex justifyContent="center" alignItems="center" height="250px">
                <Box width="70%">
                  <Pie 
                    data={datosCumplimientoForecasts} 
                    options={{ 
                      maintainAspectRatio: false
                    }}
                  />
                </Box>
              </Flex>
            </Box>
            
            <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" height="300px" overflowY="auto">
              <Heading size="sm" mb={4}>Top Clientes</Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Cliente</Th>
                    <Th isNumeric>Ventas</Th>
                    <Th isNumeric>Monto Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {clientesAgrupados
                    .sort((a: any, b: any) => b.montoTotal - a.montoTotal)
                    .slice(0, 10)
                    .map((cliente: any, index: number) => (
                      <Tr key={index}>
                        <Td>{cliente.cliente}</Td>
                        <Td isNumeric>{cliente.cantidadVentas}</Td>
                        <Td isNumeric>${cliente.montoTotal.toFixed(2)}</Td>
                      </Tr>
                    ))
                  }
                </Tbody>
              </Table>
            </Box>
          </SimpleGrid>
          
          {/* Tabla de Últimas Ventas */}
          <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" mb={8}>
            <Heading size="sm" mb={4}>Últimas Ventas</Heading>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Fecha</Th>
                    <Th>Cliente</Th>
                    <Th>Productos</Th>
                    <Th isNumeric>Monto</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {ventasFiltradas.slice(0, 10).map((venta) => (
                    <Tr key={venta.id}>
                      <Td>{formatDate(venta.fechaRegistro)}</Td>
                      <Td>{venta.cliente}</Td>
                      <Td>{venta.productos?.length || 0} items</Td>
                      <Td isNumeric>${venta.monto?.toFixed(2) || '0.00'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Estadisticas; 