import React from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
} from '@chakra-ui/react';
import { FiPlus, FiTruck, FiDollarSign, FiMapPin } from 'react-icons/fi';
import StatCard from '../components/StatCard';

const Deliveries: React.FC = () => {
  // TODO: Replace with real data from Firebase
  const mockData = {
    totalDeliveries: 150,
    averageAmount: 85,
    areasServed: 5,
    deliveriesPerArea: {
      'Área Norte': 45,
      'Área Sur': 35,
      'Área Este': 30,
      'Área Oeste': 25,
      'Área Central': 15,
    },
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading color="brand.primary">Entregas</Heading>
        <Button
          onClick={() => {}}
          bg="brand.primary"
          color="white"
          _hover={{ bg: 'brand.primary', opacity: 0.9 }}
        >
          <FiPlus style={{ marginRight: '8px' }} />
          Nueva Entrega
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6} mb={8}>
        <StatCard
          title="Total de Entregas"
          stat={mockData.totalDeliveries}
          icon={FiTruck}
          helpText="Este mes"
        />
        <StatCard
          title="Promedio por Entrega"
          stat={`$${mockData.averageAmount}`}
          icon={FiDollarSign}
          helpText="Dólares por entrega"
        />
        <StatCard
          title="Áreas Servidas"
          stat={mockData.areasServed}
          icon={FiMapPin}
          helpText="Zonas de entrega activas"
        />
      </SimpleGrid>

      <Box bg="white" p={6} rounded="lg" shadow="base">
        <Heading size="md" mb={4} color="brand.primary">
          Entregas por Área
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {Object.entries(mockData.deliveriesPerArea).map(([area, count]) => (
            <Box
              key={area}
              p={4}
              bg="gray.50"
              rounded="md"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">{area}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {count} entregas
                  </Text>
                </VStack>
                <Icon as={FiTruck} color="brand.secondary" boxSize={6} />
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default Deliveries; 