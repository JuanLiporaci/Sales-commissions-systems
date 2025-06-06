import React from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Button,
  Progress,
  useDisclosure,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';

interface CustomerCardProps {
  name: string;
  creditLimit: number;
  currentCredit: number;
  creditDays: number;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  name,
  creditLimit,
  currentCredit,
  creditDays,
}) => {
  const creditPercentage = (currentCredit / creditLimit) * 100;
  const creditStatus = creditPercentage > 80 ? 'red' : creditPercentage > 50 ? 'yellow' : 'green';

  return (
    <Box
      p={5}
      bg="white"
      rounded="lg"
      shadow="base"
      borderWidth="1px"
      borderColor="gray.100"
    >
      <VStack align="stretch" spacing={4}>
        <Heading size="md" color="brand.primary">
          {name}
        </Heading>
        
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Límite de Crédito: ${creditLimit}
          </Text>
          <Progress
            value={creditPercentage}
            colorScheme={creditStatus}
            size="sm"
            rounded="full"
          />
          <Text fontSize="sm" color="gray.500" mt={1}>
            Crédito Actual: ${currentCredit}
          </Text>
        </Box>

        <Text fontSize="sm" color="gray.500">
          Días de Crédito: {creditDays}
        </Text>
      </VStack>
    </Box>
  );
};

const Customers: React.FC = () => {
  const { onOpen } = useDisclosure();

  // TODO: Replace with real data from Firebase
  const mockCustomers = [
    {
      id: '1',
      name: 'Juan Pérez',
      creditLimit: 2000,
      currentCredit: 1500,
      creditDays: 30,
    },
    {
      id: '2',
      name: 'María García',
      creditLimit: 3000,
      currentCredit: 1000,
      creditDays: 45,
    },
    {
      id: '3',
      name: 'Carlos López',
      creditLimit: 5000,
      currentCredit: 4500,
      creditDays: 60,
    },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading color="brand.primary">Clientes</Heading>
        <Button
          onClick={onOpen}
          bg="brand.primary"
          color="white"
          _hover={{ bg: 'brand.primary', opacity: 0.9 }}
        >
          <FiPlus style={{ marginRight: '8px' }} />
          Nuevo Cliente
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {mockCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            name={customer.name}
            creditLimit={customer.creditLimit}
            currentCredit={customer.currentCredit}
            creditDays={customer.creditDays}
          />
        ))}
      </SimpleGrid>

      {/* TODO: Add NewCustomerModal component */}
    </Box>
  );
};

export default Customers; 