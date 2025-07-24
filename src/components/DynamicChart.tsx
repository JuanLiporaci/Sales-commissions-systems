import React, { useState, useEffect } from 'react';
import { Box, Spinner, Text, Center } from '@chakra-ui/react';

// Componente que carga Chart.js dinámicamente solo en el cliente
const DynamicChart = () => {
  const [loading, setLoading] = useState(true);
  const [Chart, setChart] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Importar Chart.js solo en el cliente
    const loadChart = async () => {
      try {
        console.log('Cargando Chart.js dinámicamente...');
        const { Chart } = await import('chart.js');
        const { CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } = await import('chart.js');
        const { Bar: BarComponent } = await import('react-chartjs-2');
        
        Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
        
        setChart({
          Bar: BarComponent,
          instance: Chart
        });
        console.log('Chart.js cargado correctamente');
      } catch (err) {
        console.error('Error cargando Chart.js:', err);
        setError('No se pudo cargar la biblioteca de gráficos');
      } finally {
        setLoading(false);
      }
    };

    loadChart();
  }, []);

  if (loading) {
    return (
      <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" h="300px">
        <Center h="full">
          <Spinner />
          <Text ml={3}>Cargando gráfico...</Text>
        </Center>
      </Box>
    );
  }

  if (error || !Chart) {
    return (
      <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" h="300px">
        <Center h="full">
          <Text color="red.500">{error || 'Error al cargar el gráfico'}</Text>
        </Center>
      </Box>
    );
  }

  // Datos de prueba simples
  const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril'],
    datasets: [
      {
        label: 'Ventas 2025',
        data: [12, 19, 3, 5],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as any,
      },
      title: {
        display: true,
        text: 'Gráfico Dinámico',
      },
    },
  };

  const BarChart = Chart.Bar;
  
  return (
    <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" h="300px">
      <Box h="full" w="full">
        <BarChart data={data} options={options} />
      </Box>
    </Box>
  );
};

export default DynamicChart; 