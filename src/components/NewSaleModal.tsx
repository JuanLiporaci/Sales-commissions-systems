import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/sales';
import { Sale } from '../types';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  customerId: string;
  amount: number;
  type: 'COD' | 'CREDIT';
}

const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const newSale: Omit<Sale, 'id'> = {
        ...data,
        date: new Date(),
        repId: 'current-rep-id', // TODO: Get from auth context
      };
      return salesService.createSale(newSale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboardMetrics']);
      queryClient.invalidateQueries(['sales']);
      toast({
        title: 'Venta creada',
        description: 'La venta se ha registrado exitosamente',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo crear la venta',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error creating sale:', error);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Nueva Venta</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.customerId}>
                <FormLabel>Cliente</FormLabel>
                <Input
                  {...register('customerId', { required: 'Este campo es requerido' })}
                  placeholder="ID del cliente"
                />
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.amount}>
                <FormLabel>Monto</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    {...register('amount', {
                      required: 'Este campo es requerido',
                      min: { value: 0, message: 'El monto debe ser mayor a 0' },
                    })}
                    placeholder="Monto de la venta"
                  />
                </NumberInput>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.type}>
                <FormLabel>Tipo de Venta</FormLabel>
                <Select
                  {...register('type', { required: 'Este campo es requerido' })}
                  placeholder="Selecciona el tipo de venta"
                >
                  <option value="COD">Efectivo (COD)</option>
                  <option value="CREDIT">Crédito</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              bg="brand.primary"
              color="white"
              _hover={{ bg: 'brand.primary', opacity: 0.9 }}
              isLoading={mutation.isLoading}
            >
              Crear Venta
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default NewSaleModal; 