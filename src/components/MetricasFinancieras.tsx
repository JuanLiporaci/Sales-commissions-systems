import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  FormControl,
  FormLabel,
  Input,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Tooltip,
  IconButton,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast
} from '@chakra-ui/react';
import { InfoIcon, EditIcon, CloseIcon, CheckIcon } from '@chakra-ui/icons';
import { useAuth } from '../lib/AuthContext';
import { firestoreService } from '../lib/FirestoreService';
import { where } from 'firebase/firestore';

interface Cliente {
  id: string;
  cliente: string;
  fechaPrimeraCompra?: string;
  fechaUltimaCompra?: string;
  totalGastado?: number;
  [key: string]: any;
}

interface Venta {
  id: string;
  cliente: string;
  monto: number;
  fecha: string;
  fechaRegistro: string;
  productos: any[];
  [key: string]: any;
}

interface MetricasCalculadas {
  cac: number;
  churnRate: number;
  lifeTimeValue: number;
  cacPayback: number;
  lfv: number;
  lifeTime: number;
  grossMargin: number;
  ltv: number;
}

interface ValoresIngresados {
  costoMarketing: number;
  nuevosClientes: number;
  clientesPerdidos: number;
  clientesTotales: number;
  ingresoPromedioPorCliente: number;
  margenBruto: number;
  vidaMediaCliente: number;
  costoDirecto: number;
  ingresoTotal: number;
}

const VALORES_POR_DEFECTO: ValoresIngresados = {
  costoMarketing: 10000,
  nuevosClientes: 50,
  clientesPerdidos: 5,
  clientesTotales: 100,
  ingresoPromedioPorCliente: 1500,
  margenBruto: 0.7, // 70%
  vidaMediaCliente: 24, // meses
  costoDirecto: 30000,
  ingresoTotal: 100000
};

const MetricasFinancieras: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricasCalculadas>({
    cac: 0,
    churnRate: 0,
    lifeTimeValue: 0,
    cacPayback: 0,
    lfv: 0,
    lifeTime: 0,
    grossMargin: 0,
    ltv: 0
  });
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [valores, setValores] = useState<ValoresIngresados>(VALORES_POR_DEFECTO);
  const { user } = useAuth();
  const toast = useToast();

  // Cargar datos desde Firestore
  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      try {
        // Cargar ventas
        const ventasConstraints = [
          where('usuarioEmail', '==', user.email)
        ];
        
        const ventasData = await firestoreService.getCollection(
          'ventas',
          ventasConstraints,
          { cacheKey: `metricas_ventas_${user.email}` }
        ) as Venta[];
        
        setVentas(ventasData);
        
        // Analizar clientes únicos de las ventas
        const clientesAgrupados = procesarClientes(ventasData);
        setClientes(clientesAgrupados);
        
        // Intentar calcular valores automáticos
        const valoresCalculados = calcularValoresAutomaticos(ventasData, clientesAgrupados);
        setValores(prev => ({...prev, ...valoresCalculados}));
        
        // Calcular métricas con estos valores
        calcularMetricas();
      } catch (error) {
        console.error('Error cargando datos para métricas:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos para calcular métricas',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [user?.email]);
  
  // Procesar datos de clientes a partir de ventas
  const procesarClientes = (ventas: Venta[]): Cliente[] => {
    const clientesMap = new Map<string, Cliente>();
    
    ventas.forEach(venta => {
      if (!venta.cliente) return;
      
      const clienteExistente = clientesMap.get(venta.cliente);
      const fechaVenta = new Date(venta.fechaRegistro);
      
      if (clienteExistente) {
        // Actualizar cliente existente
        const fechaUltima = clienteExistente.fechaUltimaCompra 
          ? new Date(clienteExistente.fechaUltimaCompra)
          : new Date(0);
          
        const fechaPrimera = clienteExistente.fechaPrimeraCompra
          ? new Date(clienteExistente.fechaPrimeraCompra)
          : new Date();
          
        clientesMap.set(venta.cliente, {
          ...clienteExistente,
          fechaUltimaCompra: fechaVenta > fechaUltima ? venta.fechaRegistro : clienteExistente.fechaUltimaCompra,
          fechaPrimeraCompra: fechaVenta < fechaPrimera ? venta.fechaRegistro : clienteExistente.fechaPrimeraCompra,
          totalGastado: (clienteExistente.totalGastado || 0) + (venta.monto || 0)
        });
      } else {
        // Nuevo cliente
        clientesMap.set(venta.cliente, {
          id: Math.random().toString(36).substring(7),
          cliente: venta.cliente,
          fechaPrimeraCompra: venta.fechaRegistro,
          fechaUltimaCompra: venta.fechaRegistro,
          totalGastado: venta.monto || 0
        });
      }
    });
    
    return Array.from(clientesMap.values());
  };
  
  // Calcular valores automáticos basados en los datos disponibles
  const calcularValoresAutomaticos = (ventas: Venta[], clientes: Cliente[]): Partial<ValoresIngresados> => {
    const valores: Partial<ValoresIngresados> = {};
    
    // Número total de clientes
    valores.clientesTotales = clientes.length;
    
    // Calcular ingreso promedio por cliente
    if (clientes.length > 0) {
      const ingresoTotal = clientes.reduce((sum, cliente) => sum + (cliente.totalGastado || 0), 0);
      valores.ingresoPromedioPorCliente = ingresoTotal / clientes.length;
      valores.ingresoTotal = ingresoTotal;
    }
    
    // Calcular vida media de cliente (en meses)
    // Esto es un cálculo aproximado basado en la diferencia entre primera y última compra
    const duracionesClientes = clientes
      .filter(c => c.fechaPrimeraCompra && c.fechaUltimaCompra)
      .map(cliente => {
        const fechaPrimera = new Date(cliente.fechaPrimeraCompra!);
        const fechaUltima = new Date(cliente.fechaUltimaCompra!);
        const duracionMs = fechaUltima.getTime() - fechaPrimera.getTime();
        return duracionMs / (1000 * 60 * 60 * 24 * 30); // Convertir a meses
      });
    
    if (duracionesClientes.length > 0) {
      const duracionPromedio = duracionesClientes.reduce((sum, d) => sum + d, 0) / duracionesClientes.length;
      valores.vidaMediaCliente = Math.max(1, duracionPromedio); // Al menos 1 mes
    }
    
    return valores;
  };

  // Cálculo de las métricas financieras
  const calcularMetricas = () => {
    // 1. CAC (Customer Acquisition Cost)
    const cac = valores.nuevosClientes > 0 ? 
      valores.costoMarketing / valores.nuevosClientes : 0;
    
    // 2. Churn Rate
    const churnRate = valores.clientesTotales > 0 ? 
      (valores.clientesPerdidos / valores.clientesTotales) * 100 : 0;
    
    // 3. & 8. Life Time Value (LTV)
    const ltv = valores.margenBruto > 0 ? 
      valores.ingresoPromedioPorCliente * valores.margenBruto * valores.vidaMediaCliente : 0;
    
    // 4. CAC Payback Period (en meses)
    const ingresoMensual = valores.ingresoPromedioPorCliente / 12;
    const cacPayback = ingresoMensual > 0 ? 
      cac / (ingresoMensual * valores.margenBruto) : 0;
    
    // 5. LFV (Lifetime Financial Value) - Usamos una variante de LTV
    const lfv = ltv * 0.9; // Ajustado por un factor de descuento del 10%
    
    // 6. Life Time (ya lo tenemos como valores.vidaMediaCliente)
    
    // 7. Gross Margin (Margen Bruto)
    const grossMargin = valores.ingresoTotal > 0 ? 
      ((valores.ingresoTotal - valores.costoDirecto) / valores.ingresoTotal) * 100 : 0;
    
    setMetricas({
      cac,
      churnRate,
      lifeTimeValue: ltv,
      cacPayback,
      lfv,
      lifeTime: valores.vidaMediaCliente,
      grossMargin,
      ltv
    });
  };

  // Manejar cambios en los valores ingresados
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValores({
      ...valores,
      [name]: parseFloat(value) || 0
    });
  };

  // Aplicar cambios y calcular métricas
  const aplicarCambios = () => {
    calcularMetricas();
    setModoEdicion(false);
    toast({
      title: 'Métricas actualizadas',
      description: 'Se han aplicado los valores ingresados',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Resetear a valores por defecto
  const resetearValores = () => {
    setValores(VALORES_POR_DEFECTO);
    setModoEdicion(false);
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <HStack justifyContent="space-between" mb={4}>
        <Heading size="lg">Métricas Financieras</Heading>
        <HStack>
          <Tooltip label={modoEdicion ? "Aplicar cambios" : "Editar valores"}>
            <IconButton
              aria-label={modoEdicion ? "Aplicar cambios" : "Editar valores"}
              icon={modoEdicion ? <CheckIcon /> : <EditIcon />}
              colorScheme={modoEdicion ? "green" : "blue"}
              onClick={modoEdicion ? aplicarCambios : () => setModoEdicion(true)}
            />
          </Tooltip>
          {modoEdicion && (
            <Tooltip label="Cancelar edición">
              <IconButton
                aria-label="Cancelar edición"
                icon={<CloseIcon />}
                colorScheme="red"
                onClick={() => setModoEdicion(false)}
              />
            </Tooltip>
          )}
        </HStack>
      </HStack>

      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Resultados</Tab>
          <Tab>Parámetros</Tab>
          <Tab>Definiciones</Tab>
        </TabList>

        <TabPanels>
          {/* Panel de Resultados */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {/* 1. CAC */}
              <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                <StatLabel>
                  CAC
                  <Tooltip label="Costo de Adquisición de Cliente">
                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                  </Tooltip>
                </StatLabel>
                <StatNumber>${metricas.cac.toFixed(2)}</StatNumber>
                <StatHelpText>Por cliente nuevo</StatHelpText>
              </Stat>

              {/* 2. Churn Rate */}
              <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                <StatLabel>
                  Churn Rate
                  <Tooltip label="Tasa de abandono de clientes">
                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                  </Tooltip>
                </StatLabel>
                <StatNumber>{metricas.churnRate.toFixed(2)}%</StatNumber>
                <StatHelpText>Clientes perdidos</StatHelpText>
              </Stat>

              {/* 3. LTV */}
              <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                <StatLabel>
                  LTV
                  <Tooltip label="Valor del tiempo de vida del cliente">
                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                  </Tooltip>
                </StatLabel>
                <StatNumber>${metricas.ltv.toFixed(2)}</StatNumber>
                <StatHelpText>Valor total por cliente</StatHelpText>
              </Stat>

              {/* 4. CAC Payback Period */}
              <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                <StatLabel>
                  CAC Payback
                  <Tooltip label="Período de recuperación del CAC (meses)">
                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                  </Tooltip>
                </StatLabel>
                <StatNumber>{metricas.cacPayback.toFixed(2)}</StatNumber>
                <StatHelpText>Meses hasta recuperar inversión</StatHelpText>
              </Stat>

              {/* 5. LFV */}
              <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                <StatLabel>
                  LFV
                  <Tooltip label="Valor Financiero de por Vida (ajustado)">
                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                  </Tooltip>
                </StatLabel>
                <StatNumber>${metricas.lfv.toFixed(2)}</StatNumber>
                <StatHelpText>Valor financiero ajustado</StatHelpText>
              </Stat>

              {/* 6. Life Time */}
              <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                <StatLabel>
                  Life Time
                  <Tooltip label="Tiempo promedio de retención de clientes">
                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                  </Tooltip>
                </StatLabel>
                <StatNumber>{metricas.lifeTime.toFixed(2)}</StatNumber>
                <StatHelpText>Meses como cliente</StatHelpText>
              </Stat>

              {/* 7. Gross Margin */}
              <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                <StatLabel>
                  Gross Margin
                  <Tooltip label="Margen bruto de beneficio">
                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                  </Tooltip>
                </StatLabel>
                <StatNumber>{metricas.grossMargin.toFixed(2)}%</StatNumber>
                <StatHelpText>Rentabilidad sobre ventas</StatHelpText>
              </Stat>

              {/* 8. LTV/CAC Ratio */}
              <Stat p={4} shadow="sm" borderWidth="1px" borderRadius="md">
                <StatLabel>
                  LTV/CAC Ratio
                  <Tooltip label="Relación entre LTV y CAC">
                    <InfoIcon ml={1} boxSize={3} color="gray.500" />
                  </Tooltip>
                </StatLabel>
                <StatNumber>
                  {metricas.cac > 0 ? (metricas.ltv / metricas.cac).toFixed(2) : 'N/A'}
                </StatNumber>
                <StatHelpText>
                  {metricas.cac > 0 && metricas.ltv / metricas.cac >= 3 ? 
                    '¡Excelente!' : 'Necesita mejorar'}
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </TabPanel>

          {/* Panel de Parámetros */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Heading size="md" mb={4}>Datos de Marketing</Heading>
                <SimpleGrid columns={1} spacing={4}>
                  <FormControl>
                    <FormLabel>Costo de Marketing y Ventas ($)</FormLabel>
                    <Input
                      name="costoMarketing"
                      type="number"
                      value={valores.costoMarketing}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Nuevos Clientes Adquiridos</FormLabel>
                    <Input
                      name="nuevosClientes"
                      type="number"
                      value={valores.nuevosClientes}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box>
                <Heading size="md" mb={4}>Datos de Clientes</Heading>
                <SimpleGrid columns={1} spacing={4}>
                  <FormControl>
                    <FormLabel>Clientes Perdidos (Churn)</FormLabel>
                    <Input
                      name="clientesPerdidos"
                      type="number"
                      value={valores.clientesPerdidos}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Clientes Totales</FormLabel>
                    <Input
                      name="clientesTotales"
                      type="number"
                      value={valores.clientesTotales}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box>
                <Heading size="md" mb={4}>Datos Financieros</Heading>
                <SimpleGrid columns={1} spacing={4}>
                  <FormControl>
                    <FormLabel>Ingreso Promedio por Cliente ($)</FormLabel>
                    <Input
                      name="ingresoPromedioPorCliente"
                      type="number"
                      value={valores.ingresoPromedioPorCliente}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Margen Bruto (0-1)</FormLabel>
                    <Input
                      name="margenBruto"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={valores.margenBruto}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box>
                <Heading size="md" mb={4}>Ingresos y Costos</Heading>
                <SimpleGrid columns={1} spacing={4}>
                  <FormControl>
                    <FormLabel>Ingreso Total ($)</FormLabel>
                    <Input
                      name="ingresoTotal"
                      type="number"
                      value={valores.ingresoTotal}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Costo Directo ($)</FormLabel>
                    <Input
                      name="costoDirecto"
                      type="number"
                      value={valores.costoDirecto}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box>
                <Heading size="md" mb={4}>Otros Parámetros</Heading>
                <SimpleGrid columns={1} spacing={4}>
                  <FormControl>
                    <FormLabel>Vida Media del Cliente (meses)</FormLabel>
                    <Input
                      name="vidaMediaCliente"
                      type="number"
                      value={valores.vidaMediaCliente}
                      onChange={handleInputChange}
                      isReadOnly={!modoEdicion}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
            </SimpleGrid>

            {modoEdicion && (
              <Box mt={6} textAlign="right">
                <Button colorScheme="red" mr={3} onClick={resetearValores}>
                  Restablecer Valores
                </Button>
                <Button colorScheme="green" onClick={aplicarCambios}>
                  Aplicar Cambios
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Panel de Definiciones */}
          <TabPanel>
            <Accordion allowMultiple defaultIndex={[0]}>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    CAC (Customer Acquisition Cost)
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Costo de adquisición de clientes. Se calcula dividiendo el total de gastos en marketing y ventas entre el número de nuevos clientes adquiridos en un período determinado.
                  </Text>
                  <Text mt={2} fontWeight="bold">Fórmula: CAC = Gastos en Marketing y Ventas / Nuevos Clientes</Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Churn Rate
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Tasa de abandono de clientes. Es el porcentaje de clientes que dejan de hacer negocios contigo en un período determinado.
                  </Text>
                  <Text mt={2} fontWeight="bold">Fórmula: Churn Rate = (Clientes Perdidos / Clientes Totales) × 100</Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    LTV (Lifetime Value)
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Valor del tiempo de vida del cliente. Es la predicción del ingreso neto atribuido a toda la relación futura con un cliente.
                  </Text>
                  <Text mt={2} fontWeight="bold">Fórmula: LTV = Ingreso Promedio por Cliente × Margen Bruto × Vida Media del Cliente</Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    CAC Payback Period
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Período de recuperación del CAC. Indica cuánto tiempo (generalmente en meses) toma recuperar el costo de adquisición de un cliente.
                  </Text>
                  <Text mt={2} fontWeight="bold">Fórmula: CAC Payback = CAC / (Ingreso Mensual Promedio por Cliente × Margen Bruto)</Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    LFV (Lifetime Financial Value)
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Valor financiero a lo largo de la vida. Es una variante del LTV que puede incluir ajustes financieros adicionales como factores de descuento.
                  </Text>
                  <Text mt={2} fontWeight="bold">Fórmula: LFV = LTV × Factor de Descuento</Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Life Time
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Tiempo de vida del cliente. Es el período promedio que un cliente mantiene una relación comercial con tu empresa.
                  </Text>
                  <Text mt={2} fontWeight="bold">Medido en: Meses o Años</Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Gross Margin
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Margen bruto. Es el porcentaje de ingresos que excede los costos directos de producir bienes o servicios.
                  </Text>
                  <Text mt={2} fontWeight="bold">Fórmula: Gross Margin = ((Ingresos Totales - Costos Directos) / Ingresos Totales) × 100</Text>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    LTV/CAC Ratio
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Relación entre LTV y CAC. Es un indicador clave para evaluar la eficiencia del modelo de negocio. Un ratio saludable es 3:1 o mayor.
                  </Text>
                  <Text mt={2} fontWeight="bold">Fórmula: LTV/CAC Ratio = LTV / CAC</Text>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default MetricasFinancieras; 