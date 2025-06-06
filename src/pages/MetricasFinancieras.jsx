import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Form, Table, Alert, Tabs, Tab, Container } from 'react-bootstrap';
import { 
  FiBarChart2, FiDollarSign, FiUsers, FiTag, FiTrendingUp, 
  FiHome, FiShoppingBag, FiMapPin, FiSettings, FiLogOut, 
  FiMenu, FiInfo, FiEdit, FiSave, FiRefreshCw
} from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { salesService } from '../services/sales.ts';
import { metricasService } from '../services/metricas';
import { customersService } from '../services/customers';

const MetricasFinancieras = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  // Estado para métricas financieras
  const [metricas, setMetricas] = useState({
    // Configuración
    modoCalculoAutomatico: true,
    
    // Valores para cálculos
    tasaChurn: 5, // % mensual
    inversionMarketing: 5000, // $ mensual
    nuevosClientes: 15, // cantidad mensual
    margenBruto: 40, // % 
    ticketPromedio: 0, // calculado desde ventas
    ventasMensuales: 0, // calculado desde ventas
    recurrenciaCompra: 2, // veces por mes
    
    // Resultados calculados
    cac: 0, // Customer Acquisition Cost
    ltv: 0, // Lifetime Value
    cacPaybackPeriod: 0, // CAC Payback Period
    lifv: 0, // Lifetime Financial Value
    lifeTime: 0, // Tiempo de vida del cliente en meses
  });
  
  const [editMode, setEditMode] = useState(false);

  // Función para traer ventas
  async function cargarVentasFirestore(usuarioEmail) {
    try {
      const ventasData = await salesService.getSalesByUserEmail(usuarioEmail);
      return ventasData;
    } catch (error) {
      console.error('Error cargando ventas:', error);
      return [];
    }
  }
  
  // Función para cargar métricas desde Firestore
  async function cargarMetricasFirestore(usuarioEmail) {
    try {
      const metricasData = await metricasService.obtenerUltimasMetricas(usuarioEmail);
      if (metricasData) {
        console.log('Métricas cargadas desde Firestore:', metricasData);
        setMetricas(prev => ({
          ...prev,
          ...metricasData,
          modoCalculoAutomatico: prev.modoCalculoAutomatico, // Mantenemos la preferencia del usuario
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cargando métricas desde Firestore:', error);
      return false;
    }
  }

  useEffect(() => {
    if (!user.admin) {
      navigate('/dashboard'); // O la ruta principal de admin
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      if (!user?.email) {
        setLoading(false);
        return;
      }
      // Intentar cargar métricas desde Firestore primero
      const metricasExistentes = await cargarMetricasFirestore(user.email);
      // Cargar ventas para cálculos
      const ventasData = await cargarVentasFirestore(user.email);
      setVentas(ventasData);
      // Cargar clientes para cálculos
      let clientesData = [];
      try {
        clientesData = await customersService.getCustomers();
        setClientes(clientesData);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
      }
      // Cargar historial de métricas
      try {
        const historialData = await metricasService.obtenerHistorialMetricas(user.email);
        setHistorial(historialData);
      } catch (err) {
        console.error('Error al cargar historial de métricas:', err);
      }
      // Si no hay métricas en Firestore o están en modo automático, calcular
      if (!metricasExistentes || metricas.modoCalculoAutomatico) {
        // --- FILTRAR POR MES ACTUAL ---
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const anioActual = ahora.getFullYear();
        // Ventas del mes actual
        const ventasMes = ventasData.filter(v => {
          const fecha = v.fecha ? new Date(v.fecha) : (v.date ? new Date(v.date) : null);
          return fecha && fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
        });
        // Clientes del mes actual
        const clientesMes = clientesData.filter(c => {
          const fecha = c.fechaRegistro ? new Date(c.fechaRegistro) : (c.createdAt ? new Date(c.createdAt) : null);
          return fecha && fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
        });
        // Ticket promedio y ventas mensuales
        const totalVentasMes = ventasMes.reduce((sum, v) => sum + (parseFloat(v.monto) || 0), 0);
        const ticketPromedio = ventasMes.length > 0 ? totalVentasMes / ventasMes.length : 0;
        const ventasMensuales = totalVentasMes;
        // Nuevos clientes
        const nuevosClientes = clientesMes.length;
        // Recurrencia de compra (opcional, promedio de compras por cliente en el mes)
        const clientesUnicosConVenta = new Set(ventasMes.map(v => v.clienteId || v.cliente || v.customerId)).size;
        const recurrenciaCompra = clientesUnicosConVenta > 0 ? ventasMes.length / clientesUnicosConVenta : 0;
        // Actualizar métricas
        const nuevasMetricas = {
          ...metricas,
          ticketPromedio: isNaN(ticketPromedio) ? 0 : ticketPromedio,
          ventasMensuales,
          nuevosClientes,
          recurrenciaCompra: recurrenciaCompra || metricas.recurrenciaCompra,
        };
        setMetricas(nuevasMetricas);
        calcularMetricas(nuevasMetricas);
      }
      setLoading(false);
    }
    fetchData();
  }, [user.email]);

  // Función para calcular todas las métricas
  const calcularMetricas = async (valores) => {
    // Usar el servicio para calcular métricas
    try {
      const calculadas = await metricasService.calcularMetricas(valores);
      setMetricas(prev => ({
        ...prev,
        ...calculadas
      }));
      return calculadas;
    } catch (error) {
      console.error('Error calculando métricas:', error);
      return null;
    }
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'modoCalculoAutomatico' ? e.target.checked : parseFloat(value);
    
    setMetricas(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Calcular manualmente las métricas cuando el usuario lo solicite
  const handleCalcular = async () => {
    const calculadas = await calcularMetricas(metricas);
    
    // Si estamos en modo de edición y el usuario pide cálculo manual, guardamos en Firestore
    if (editMode && calculadas) {
      guardarMetricasEnFirestore(calculadas);
    }
  };
  
  // Guardar métricas en Firestore
  const guardarMetricasEnFirestore = async (metricasAGuardar) => {
    if (!user.email) return;
    
    setGuardando(true);
    try {
      await metricasService.guardarMetricas(user.email, metricasAGuardar || metricas);
      
      // Actualizar el historial
      const historialActualizado = await metricasService.obtenerHistorialMetricas(user.email);
      setHistorial(historialActualizado);
      
      alert('Métricas guardadas correctamente en Firestore');
    } catch (error) {
      console.error('Error al guardar métricas en Firestore:', error);
      alert('Error al guardar métricas en Firestore');
    } finally {
      setGuardando(false);
    }
  };

  // Togglear modo de edición
  const toggleEditMode = () => {
    if (editMode) {
      guardarMetricasEnFirestore();
      calcularMetricas(metricas); // Recalcular métricas al guardar
    }
    setEditMode(!editMode);
    if (!editMode && metricas.modoCalculoAutomatico) {
      calcularMetricas(metricas);
    }
  };

  useEffect(() => {
    console.log('MetricasFinancieras montado');
  }, []);

  console.log('Renderizando MetricasFinancieras');
  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0" style={{ fontWeight: 700, color: '#1a237e' }}>
          Métricas Financieras
        </h2>
        <Button as={Link} to="/dashboard" variant="outline-primary">
          Volver al Dashboard
        </Button>
      </div>
      <div className="dashboard-content">
        <div className="py-4 px-2">
          <Row className="mb-4">
            <Col md={12}>
              <Alert variant="info" className="mb-4">
                <Alert.Heading className="d-flex align-items-center">
                  <FiInfo className="me-2" /> Métricas Financieras para la Toma de Decisiones
                </Alert.Heading>
                <p>
                  Estas métricas te ayudarán a entender y mejorar la rentabilidad de tu negocio, optimizar
                  tu estrategia de adquisición de clientes y maximizar el valor de tus clientes actuales.
                </p>
              </Alert>
            </Col>
          </Row>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3">Cargando métricas financieras...</p>
            </div>
          ) : (
            <Tabs 
              defaultActiveKey="resultados" 
              id="metricas-tabs" 
              className="mb-4"
            >
              {/* Tab de Resultados */}
              <Tab eventKey="resultados" title="Resultados">
                <Card className="shadow-sm border-0 mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">Métricas Financieras Calculadas</h5>
                      <Button 
                        variant={editMode ? "success" : "primary"} 
                        size="sm"
                        onClick={toggleEditMode}
                        className="d-flex align-items-center"
                        disabled={guardando}
                      >
                        {guardando ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Guardando...
                          </>
                        ) : editMode ? (
                          <><FiSave className="me-1" /> Guardar</>
                        ) : (
                          <><FiEdit className="me-1" /> Editar</>
                        )}
                      </Button>
                    </div>
                    
                    <Row>
                      <Col md={4} className="mb-3">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="text-center">
                            <FiDollarSign className="text-primary" size={28} />
                            <h6 className="mt-2 mb-1">CAC</h6>
                            <div className="h4 mb-0">${metricas.cac.toFixed(2)}</div>
                            <small className="text-muted">Costo de Adquisición de Cliente</small>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="text-center">
                            <FiUsers className="text-primary" size={28} />
                            <h6 className="mt-2 mb-1">Nuevos Clientes</h6>
                            <div className="h4 mb-0">{metricas.nuevosClientes}</div>
                            <small className="text-muted">Clientes nuevos este mes</small>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="text-center">
                            <FiUsers className="text-success" size={28} />
                            <h6 className="mt-2 mb-1">Churn Rate</h6>
                            <div className="h4 mb-0">{metricas.tasaChurn}%</div>
                            <small className="text-muted">Tasa de Abandono Mensual</small>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="text-center">
                            <FiTrendingUp className="text-info" size={28} />
                            <h6 className="mt-2 mb-1">LTV</h6>
                            <div className="h4 mb-0">${metricas.ltv.toFixed(2)}</div>
                            <small className="text-muted">Valor de Vida del Cliente</small>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="text-center">
                            <FiBarChart2 className="text-warning" size={28} />
                            <h6 className="mt-2 mb-1">CAC Payback Period</h6>
                            <div className="h4 mb-0">{metricas.cacPaybackPeriod.toFixed(1)} meses</div>
                            <small className="text-muted">Período de Recuperación</small>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="text-center">
                            <FiDollarSign className="text-primary" size={28} />
                            <h6 className="mt-2 mb-1">LIFV</h6>
                            <div className="h4 mb-0">${metricas.lifv.toFixed(2)}</div>
                            <small className="text-muted">Valor Financiero de Vida</small>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="text-center">
                            <FiTrendingUp className="text-success" size={28} />
                            <h6 className="mt-2 mb-1">Life Time</h6>
                            <div className="h4 mb-0">{metricas.lifeTime.toFixed(1)} meses</div>
                            <small className="text-muted">Tiempo de Vida del Cliente</small>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>
              
              {/* Tab de Historial */}
              <Tab eventKey="historial" title="Historial">
                <Card className="shadow-sm border-0 mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">Historial de Métricas</h5>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={async () => {
                          const historialActualizado = await metricasService.obtenerHistorialMetricas(user.email);
                          setHistorial(historialActualizado);
                        }}
                        className="d-flex align-items-center"
                      >
                        <FiRefreshCw className="me-1" /> Actualizar
                      </Button>
                    </div>
                    
                    {historial.length > 0 ? (
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>CAC</th>
                              <th>LTV</th>
                              <th>LIFV</th>
                              <th>Churn Rate</th>
                              <th>CAC Payback</th>
                              <th>Life Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historial.map((registro, idx) => (
                              <tr key={registro.id || idx}>
                                <td>{new Date(registro.fechaCalculo).toLocaleDateString()}</td>
                                <td>${registro.cac ? registro.cac.toFixed(2) : '0.00'}</td>
                                <td>${registro.ltv ? registro.ltv.toFixed(2) : '0.00'}</td>
                                <td>${registro.lifv ? registro.lifv.toFixed(2) : '0.00'}</td>
                                <td>{registro.tasaChurn}%</td>
                                <td>{registro.cacPaybackPeriod ? registro.cacPaybackPeriod.toFixed(1) : '0.0'} meses</td>
                                <td>{registro.lifeTime ? registro.lifeTime.toFixed(1) : '0.0'} meses</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p>No hay historial de métricas disponible.</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
              
              {/* Tab de Parámetros */}
              <Tab eventKey="parametros" title="Parámetros">
                <Card className="shadow-sm border-0 mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">Configuración de Parámetros</h5>
                      <Button 
                        variant={editMode ? "success" : "primary"} 
                        size="sm"
                        onClick={toggleEditMode}
                        className="d-flex align-items-center"
                        disabled={guardando}
                      >
                        {guardando ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Guardando...
                          </>
                        ) : editMode ? (
                          <><FiSave className="me-1" /> Guardar</>
                        ) : (
                          <><FiEdit className="me-1" /> Editar</>
                        )}
                      </Button>
                    </div>
                    
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="inversionMarketing">
                          <Form.Label>Inversión en Marketing (mensual)</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="inversionMarketing" 
                            value={metricas.inversionMarketing}
                            onChange={handleInputChange}
                            disabled={!editMode}
                          />
                          <Form.Text className="text-muted">
                            Cuánto inviertes mensualmente en marketing y publicidad ($)
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="nuevosClientes">
                          <Form.Label>Nuevos Clientes (mensual)</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="nuevosClientes" 
                            value={metricas.nuevosClientes}
                            onChange={handleInputChange} 
                            disabled={!editMode}
                          />
                          <Form.Text className="text-muted">
                            Cantidad de nuevos clientes que adquieres al mes
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="tasaChurn">
                          <Form.Label>Tasa de Abandono (Churn Rate)</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="tasaChurn" 
                            value={metricas.tasaChurn}
                            onChange={handleInputChange}
                            disabled={!editMode}
                          />
                          <Form.Text className="text-muted">
                            % de clientes que dejan de comprar cada mes
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="margenBruto">
                          <Form.Label>Margen Bruto</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="margenBruto" 
                            value={metricas.margenBruto}
                            onChange={handleInputChange}
                            disabled={!editMode}
                          />
                          <Form.Text className="text-muted">
                            % de ganancia bruta promedio de tus ventas
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="recurrenciaCompra">
                          <Form.Label>Frecuencia de Compra</Form.Label>
                          <Form.Control 
                            type="number" 
                            name="recurrenciaCompra" 
                            value={metricas.recurrenciaCompra}
                            onChange={handleInputChange}
                            disabled={!editMode}
                          />
                          <Form.Text className="text-muted">
                            Número promedio de compras que hace un cliente por mes
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="ticketPromedio">
                          <Form.Label>Ticket Promedio</Form.Label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Form.Control 
                              type="number" 
                              name="ticketPromedio" 
                              value={metricas.ticketPromedio}
                              onChange={handleInputChange}
                              disabled={!editMode || metricas.modoCalculoAutomatico}
                            />
                            {metricas.modoCalculoAutomatico && (
                              <span style={{ color: '#888', fontSize: 13 }}>
                                (Desactiva el cálculo automático para editar)
                              </span>
                            )}
                          </div>
                          <Form.Text className="text-muted">
                            Valor promedio de cada compra ($) - Calculado automáticamente
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>
              
              {/* Tab de Definiciones */}
              <Tab eventKey="definiciones" title="Definiciones">
                <Card className="shadow-sm border-0 mb-4">
                  <Card.Body>
                    <h5 className="mb-4">Glosario de Métricas</h5>
                    <Table bordered responsive className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Métrica</th>
                          <th>Definición</th>
                          <th>Fórmula</th>
                          <th>Impacto en el Negocio</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>CAC</strong><br />(Customer Acquisition Cost)</td>
                          <td>Costo promedio de adquirir un nuevo cliente.</td>
                          <td>Inversión en Marketing / Nuevos Clientes</td>
                          <td>Un CAC menor significa que es más barato atraer nuevos clientes. Si es muy alto en comparación con el LTV, tu negocio podría no ser sostenible.</td>
                        </tr>
                        <tr>
                          <td><strong>Churn Rate</strong></td>
                          <td>Porcentaje de clientes que dejan de comprar en un período.</td>
                          <td>Clientes Perdidos / Total de Clientes</td>
                          <td>Un churn bajo significa alta retención. Reducir el churn es clave para mejorar el LTV y rentabilidad general.</td>
                        </tr>
                        <tr>
                          <td><strong>LTV</strong><br />(Lifetime Value)</td>
                          <td>Valor total que un cliente genera durante su relación con la empresa.</td>
                          <td>Ticket Promedio × Frecuencia de Compra × Life Time</td>
                          <td>Ayuda a determinar cuánto vale un cliente y cuánto puedes invertir para adquirirlo. Idealmente, LTV {'>'} 3×CAC.</td>
                        </tr>
                        <tr>
                          <td><strong>CAC Payback Period</strong></td>
                          <td>Tiempo necesario para recuperar el costo de adquisición de un cliente.</td>
                          <td>CAC / (Ticket Promedio × Frecuencia × Margen Bruto)</td>
                          <td>Idealmente debería ser menor a 12 meses. Cuanto menor sea, más rápido recuperas tu inversión.</td>
                        </tr>
                        <tr>
                          <td><strong>LIFV</strong><br />(Lifetime Financial Value)</td>
                          <td>Ganancia neta generada por un cliente durante su vida útil.</td>
                          <td>LTV × Margen Bruto</td>
                          <td>Representa la contribución real del cliente a tus beneficios. Debe ser significativamente mayor que el CAC.</td>
                        </tr>
                        <tr>
                          <td><strong>Life Time</strong></td>
                          <td>Tiempo promedio que un cliente permanece comprando.</td>
                          <td>1 / Churn Rate</td>
                          <td>Aumentar el tiempo de vida del cliente es clave para mejorar el LTV y reducir la presión por adquirir nuevos clientes.</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          )}
        </div>
      </div>
    </Container>
  );
};

export default MetricasFinancieras; 