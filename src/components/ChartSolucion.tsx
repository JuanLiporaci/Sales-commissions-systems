import React, { useEffect, useRef, useState } from 'react';
import { Box, Heading, Spinner, Center } from '@chakra-ui/react';

const ChartSolucion = () => {
  const chartRef = useRef<any>(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [chartError, setChartError] = useState(false);

  useEffect(() => {
    let chartInstance: any = null;
    
    const loadChartLibrary = async () => {
      try {
        // Importando Chart.js dinámicamente
        const { Chart, registerables } = await import('chart.js');
        // Registrar todos los componentes necesarios
        Chart.register(...registerables);
        
        // Si el canvas existe, crear el gráfico
        if (chartRef.current) {
          const ctx = chartRef.current.getContext('2d');
          
          if (ctx) {
            console.log('Creando gráfico con solución optimizada');
            
            // Datos de ejemplo
            chartInstance = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
                datasets: [{
                  label: 'Ventas Mensuales 2024',
                  data: [12, 19, 3, 5, 8, 15],
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
            
            setChartLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error cargando Chart.js:', error);
        setChartError(true);
      }
    };

    loadChartLibrary();

    // Limpiar el gráfico cuando el componente se desmonte
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  return (
    <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" height="300px">
      <Heading size="md" mb={4}>Gráfico de Ventas Mensuales</Heading>
      
      {!chartLoaded && !chartError ? (
        <Center height="200px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : chartError ? (
        <Center height="200px">
          <Heading size="sm" color="red.500">Error al cargar el gráfico</Heading>
        </Center>
      ) : (
        <Box height="230px">
          <canvas ref={chartRef} />
        </Box>
      )}
    </Box>
  );
};

export default ChartSolucion; 