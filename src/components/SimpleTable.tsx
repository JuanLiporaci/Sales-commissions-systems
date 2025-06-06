import React from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Text } from '@chakra-ui/react';

const SimpleTable = () => {
  // Datos ficticios
  const datos = [
    { mes: 'Enero', ventas: 1200, clientes: 45 },
    { mes: 'Febrero', ventas: 1800, clientes: 53 },
    { mes: 'Marzo', ventas: 800, clientes: 30 },
    { mes: 'Abril', ventas: 1500, clientes: 48 },
    { mes: 'Mayo', ventas: 2200, clientes: 60 },
  ];

  return (
    <Box p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
      <Heading size="md" mb={4}>Datos de Ventas (Tabla)</Heading>
      
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Mes</Th>
            <Th isNumeric>Ventas ($)</Th>
            <Th isNumeric>Clientes</Th>
          </Tr>
        </Thead>
        <Tbody>
          {datos.map((fila, i) => (
            <Tr key={i}>
              <Td>{fila.mes}</Td>
              <Td isNumeric>${fila.ventas.toFixed(2)}</Td>
              <Td isNumeric>{fila.clientes}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      <Text mt={4} fontSize="sm" color="gray.500">
        Tabla de ejemplo como alternativa a los gráficos.
      </Text>
    </Box>
  );
};

export default SimpleTable; 