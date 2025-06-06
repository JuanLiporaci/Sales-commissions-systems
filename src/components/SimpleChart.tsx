import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registrar solo los componentes necesarios para el gráfico de barras
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SimpleChart = () => {
  console.log('Renderizando SimpleChart');
  
  // Datos de prueba muy simples
  const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril'],
    datasets: [
      {
        label: 'Ventas por Mes',
        data: [12, 19, 3, 5],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Opciones simples
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Gráfico de Prueba',
      },
    },
  };
  
  return (
    <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
      <Heading size="md" mb={4}>Gráfico de Prueba</Heading>
      <Box height="300px">
        <Bar data={data} options={options} />
      </Box>
    </Box>
  );
};

export default SimpleChart; 