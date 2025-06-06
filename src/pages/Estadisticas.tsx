import React, { useState } from 'react';
import { Box, Heading, VStack, Text, Divider, Button, Flex, Spacer } from '@chakra-ui/react';
import EstadisticasComponent from '../components/Estadisticas';
import SimpleChart from '../components/SimpleChart';
import DynamicChart from '../components/DynamicChart';
import SimpleTable from '../components/SimpleTable';
import ChartSolucion from '../components/ChartSolucion';
import VentasTendenciaChart from '../components/VentasTendenciaChart';
import MetricasFinancieras from '../components/MetricasFinancieras';

const Estadisticas = () => {
  console.log('Renderizando página Estadisticas');
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [mostrarTendencias, setMostrarTendencias] = useState(false);
  const [mostrarMetricas, setMostrarMetricas] = useState(false);
  
  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Estadísticas y Gráficos</Heading>
        
        <Box border="1px" borderColor="red.300" bg="red.50" p={4} borderRadius="md">
          <Heading size="sm" color="red.600" mb={2}>Optimización de Lecturas</Heading>
          <Text fontSize="sm">
            Para reducir lecturas a Firestore, los componentes que consultan datos se cargarán solo cuando lo solicites.
          </Text>
        </Box>
        
        <Box>
          <Flex mb={4}>
            <Heading size="md">Métricas Financieras</Heading>
            <Spacer />
            <Button 
              size="sm" 
              colorScheme={mostrarMetricas ? "red" : "blue"}
              onClick={() => setMostrarMetricas(!mostrarMetricas)}
            >
              {mostrarMetricas ? "Ocultar" : "Mostrar"}
            </Button>
          </Flex>
          {mostrarMetricas && <MetricasFinancieras />}
        </Box>
        
        <Divider my={4} />
        
        <Box>
          <Flex mb={4}>
            <Heading size="md">Tendencia de Ventas</Heading>
            <Spacer />
            <Button 
              size="sm" 
              colorScheme={mostrarTendencias ? "red" : "blue"}
              onClick={() => setMostrarTendencias(!mostrarTendencias)}
            >
              {mostrarTendencias ? "Ocultar" : "Mostrar"}
            </Button>
          </Flex>
          {mostrarTendencias && <VentasTendenciaChart />}
        </Box>
        
        <Divider my={4} />
        
        <Box>
          <Flex mb={4}>
            <Heading size="md">Estadísticas Completas</Heading>
            <Spacer />
            <Button 
              size="sm" 
              colorScheme={mostrarEstadisticas ? "red" : "blue"}
              onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
            >
              {mostrarEstadisticas ? "Ocultar" : "Mostrar"}
            </Button>
          </Flex>
          {mostrarEstadisticas && <EstadisticasComponent />}
        </Box>
        
        <Divider my={4} />
        
        <Heading size="md">Componentes de ejemplo (no consultan Firestore)</Heading>
        <SimpleChart />
        <DynamicChart />
        <SimpleTable />
        <ChartSolucion />
      </VStack>
    </Box>
  );
};

export default Estadisticas; 