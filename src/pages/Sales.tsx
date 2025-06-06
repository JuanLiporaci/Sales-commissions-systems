import React from 'react';
import {
  Box,
  Heading,
  Badge,
  Button,
  HStack,
  useDisclosure,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/sales';
import NewSaleModal from '../components/NewSaleModal';

const Sales: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: sales, isLoading, error } = useQuery({
    queryKey: ['sales'],
    queryFn: salesService.getSales,
  });

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.primary" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box>
        <Heading mb={6} color="red.500">Error loading sales</Heading>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading color="brand.primary">Ventas</Heading>
        <Button
          onClick={onOpen}
          bg="brand.primary"
          color="white"
          _hover={{ bg: 'brand.primary', opacity: 0.9 }}
        >
          <FiPlus style={{ marginRight: '8px' }} />
          Nueva Venta
        </Button>
      </HStack>

      <Box bg="white" rounded="lg" shadow="base" overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Fecha</Th>
                <Th>Cliente</Th>
                <Th isNumeric>Monto</Th>
                <Th>Tipo</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sales?.map((sale) => (
                <Tr key={sale.id}>
                  <Td>{sale.date.toLocaleDateString()}</Td>
                  <Td>{sale.customerId}</Td>
                  <Td isNumeric>${sale.amount}</Td>
                  <Td>
                    <Badge
                      colorScheme={sale.type === 'COD' ? 'green' : 'blue'}
                      rounded="full"
                      px={2}
                    >
                      {sale.type}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <NewSaleModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

export default Sales; 