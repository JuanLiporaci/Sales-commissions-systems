import React, { useEffect, useRef } from 'react';
import { Box, Text } from '@chakra-ui/react';
import Chart from 'chart.js/auto';

const ChartFix = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Limpiar cualquier gráfico existente
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Si el canvas está disponible, crear el gráfico
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        console.log('Creando gráfico con Chart.js directamente');
        
        // Datos de ejemplo
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Rojo', 'Azul', 'Amarillo', 'Verde', 'Morado', 'Naranja'],
            datasets: [{
              label: 'Ejemplo directo con Chart.js',
              data: [12, 19, 3, 5, 2, 3],
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
      }
    }

    // Limpiar el gráfico cuando el componente se desmonte
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" height="300px">
      <Text mb={2} fontWeight="bold">Gráfico creado directamente con Chart.js</Text>
      <Box height="250px">
        <canvas ref={chartRef} />
      </Box>
    </Box>
  );
};

export default ChartFix; 