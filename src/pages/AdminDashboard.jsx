import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Alert, Button, Form, Modal } from 'react-bootstrap';
import { FiBarChart2, FiDollarSign, FiUsers, FiFileText, FiDownload, FiChevronDown, FiEye, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { exportArrayToExcel } from '../utils/excelExport.js';
import Select from 'react-select';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [ventaExpandidaId, setVentaExpandidaId] = useState(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bonusOn, setBonusOn] = useState(() => {
    const saved = localStorage.getItem('bonusOn');
    return saved === null ? false : saved === 'true';
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true);
      try {
        const ventasRef = collection(db, 'ventas');
        const q = query(ventasRef, orderBy('fechaRegistro', 'desc'));
        const querySnapshot = await getDocs(q);
        const ventasFirestore = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setVentas(ventasFirestore);
        // Extraer usuarios únicos
        const usuariosUnicos = Array.from(new Set(ventasFirestore.map(v => v.usuarioEmail)));
        setUsuarios(usuariosUnicos);
      } catch (err) {
        setError('Error cargando ventas de Firestore');
      }
      setLoading(false);
    };
    fetchVentas();
  }, []);

  useEffect(() => {
    localStorage.setItem('bonusOn', bonusOn);
  }, [bonusOn]);

  // Filtros combinados
  const ventasFiltradas = ventas.filter(v => {
    const usuarioOk = usuariosSeleccionados.length === 0 || usuariosSeleccionados.includes(v.usuarioEmail);
    let fechaOk = true;
    if (fechaInicio) {
      const fechaVenta = v.fecha ? new Date(v.fecha) : null;
      const inicio = new Date(fechaInicio);
      if (fechaVenta && fechaVenta < inicio) fechaOk = false;
    }
    if (fechaFin) {
      const fechaVenta = v.fecha ? new Date(v.fecha) : null;
      const fin = new Date(fechaFin);
      fin.setDate(fin.getDate() + 1);
      if (fechaVenta && fechaVenta >= fin) fechaOk = false;
    }
    return usuarioOk && fechaOk;
  });

  // Lógica de sumatorias:
  const ventasPagadas = ventasFiltradas.filter(v => v.pago === true);
  const ventasPorCobrar = ventasFiltradas.filter(v => v.tipoPago === 'Crédito' && v.pago === false);
  const ventasTotales = ventasPagadas.reduce((sum, v) => sum + (parseFloat(v.monto) || 0), 0);
  const profitTotales = ventasPagadas.reduce((sum, v) => sum + (parseFloat(v.profit) || 0), 0);
  const cuentasPorCobrar = ventasPorCobrar.reduce((sum, v) => sum + (parseFloat(v.monto) || 0), 0);
  // Solo sumar comisiones de ventas pagadas
  const comisionesTotales = ventasPagadas.reduce((sum, v) => sum + (parseFloat(v.comision) || 0), 0);

  // Función para exportar a Excel
  const exportToExcel = async () => {
    if (ventasFiltradas.length === 0) return;
    // Encabezados generales de venta
    const headersVenta = ['Fecha', 'Usuario', 'Identificador Vendedor', 'Cliente', 'Monto', 'Comisión', 'Profit', 'Fee Venta'];
    // Encabezados de productos
    const headersProductos = ['Producto', 'Cantidad', 'Costo', 'Precio Venta', 'Profit'];
    // Construir datos
    let data = [];
    ventasFiltradas.forEach(venta => {
      // Fila de la venta
      data.push([
        new Date(venta.fecha).toLocaleDateString(),
        venta.usuarioEmail,
        venta.identificador || '-',
        venta.cliente,
        (venta.monto || 0).toFixed(2),
        (venta.comision || 0).toFixed(2),
        (venta.profit || 0).toFixed(2),
        (venta.feeVenta || 0).toFixed(2)
      ]);
      // Encabezados de productos
      data.push(headersProductos);
      // Filas de productos
      (venta.productos || []).forEach(p => {
        data.push([
          p.description || p.nombre || p.name || '-',
          p.cantidad || 1,
          Number(p.costo || 0).toFixed(2),
          Number(p.precioVenta || 0).toFixed(2),
          Number(p.profit || 0).toFixed(2)
        ]);
      });
      // Fila vacía para separar ventas
      data.push([]);
    });
    // Agregar encabezados generales al principio
    data.unshift(headersVenta);
    // Agregar fila de totales al final
    data.push([
      '', '', '', 'Totales:',
      ventasTotales.toFixed(2),
      comisionesTotales.toFixed(2),
      profitTotales.toFixed(2),
      cuentasPorCobrar.toFixed(2)
    ]);
    await exportArrayToExcel(data, `ventas_registradas_${new Date().toISOString().split('T')[0]}.xlsx`, 'Ventas');
  };

  // Opciones para react-select
  const opcionesUsuarios = usuarios.map(u => ({ value: u, label: u }));

  const handleAbrirModal = (venta) => {
    setVentaSeleccionada(venta);
    setMostrarModal(true);
  };
  const handleCerrarModal = () => {
    setMostrarModal(false);
    setVentaSeleccionada(null);
  };

  const handleExpandirVenta = (ventaId) => {
    setVentaExpandidaId(ventaExpandidaId === ventaId ? null : ventaId);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/login'); // Cambia '/login' por la ruta de tu login si es diferente
    } catch (error) {
      alert('Error al cerrar sesión');
    }
  };

  console.log('Renderizando AdminDashboard');
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="mb-0 d-flex align-items-center">
          <FiBarChart2 className="me-2 text-primary" /> Dashboard de Administración
        </h2>
        <Button variant="outline-danger" onClick={handleLogout} size="sm">
          Cerrar sesión
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <div className="d-flex align-items-center">
                <FiDollarSign className="me-3 text-success" size={32} />
                <div>
                  <h5 className="mb-0">${ventasTotales.toFixed(2)}</h5>
                  <small>Ventas Totales</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <div className="d-flex align-items-center">
                <FiAlertTriangle className="me-3 text-warning" size={32} />
                <div>
                  <h5 className="mb-0">${cuentasPorCobrar.toFixed(2)}</h5>
                  <small>Cuentas por cobrar</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <div className="d-flex align-items-center">
                <FiBarChart2 className="me-3 text-warning" size={32} />
                <div>
                  <h5 className="mb-0">${profitTotales.toFixed(2)}</h5>
                  <small>Profit Total</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <Form.Check 
              type="switch"
              id="bonus-switch"
              label={<span style={{fontWeight:600}}>{`Comisiones: ${bonusOn ? 'ON' : 'OFF'}`}</span>}
              checked={bonusOn}
              onChange={() => setBonusOn(v => !v)}
              style={{marginRight:16, fontSize:18}}
            />
            <FiFileText className="me-2 text-primary" />
            <h5 className="mb-0">Ventas Registradas</h5>
            <div className="ms-auto d-flex align-items-center gap-2" style={{ width: 'auto' }}>
              <span style={{ color: '#888', fontWeight: 500, marginRight: 12, minWidth: 120 }}>Filtrar usuarios</span>
              <div style={{ width: 340, marginRight: 16 }}>
                <Select
                  isMulti
                  options={opcionesUsuarios}
                  value={opcionesUsuarios.filter(opt => usuariosSeleccionados.includes(opt.value))}
                  onChange={selected => setUsuariosSeleccionados(selected ? selected.map(opt => opt.value) : [])}
                  placeholder="Seleccionar usuarios"
                  noOptionsMessage={() => 'Sin usuarios'}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: 36,
                      border: '2px solid #007bff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      fontWeight: 600,
                      color: '#222',
                      background: 'rgba(255,255,255,0.95)',
                      cursor: 'pointer',
                    }),
                    multiValue: (base) => ({
                      ...base,
                      background: '#e3f0ff',
                      color: '#007bff',
                      fontWeight: 700
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#007bff',
                      fontWeight: 700
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#007bff',
                      ':hover': { backgroundColor: '#007bff', color: 'white' }
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#888',
                      fontWeight: 500
                    })
                  }}
                  isClearable
                />
              </div>
              <Form.Control
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                size="sm"
                style={{
                  width: 140,
                  background: 'rgba(255,255,255,0.95)',
                  border: '2px solid #007bff',
                  fontWeight: 600,
                  color: '#222',
                  marginLeft: 0,
                  marginRight: 8
                }}
                placeholder="Desde"
              />
              <Form.Control
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                size="sm"
                style={{
                  width: 140,
                  background: 'rgba(255,255,255,0.95)',
                  border: '2px solid #007bff',
                  fontWeight: 600,
                  color: '#222',
                  marginLeft: 0,
                  marginRight: 16
                }}
                placeholder="Hasta"
              />
            </div>
            <Button variant="outline-success" size="sm" className="ms-3" onClick={exportToExcel} disabled={ventasFiltradas.length === 0}>
              <FiDownload className="me-1" /> Exportar Excel
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-5">Cargando ventas...</div>
          ) : ventasFiltradas.length === 0 ? (
            <div className="text-center py-5">No hay ventas registradas.</div>
          ) : (
            <Table responsive hover className="mb-0 table-modern">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Identificador Vendedor</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Comisión</th>
                  <th>Profit</th>
                  <th>Fee Venta</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map(venta => [
                  <tr key={venta.id} style={venta.pago === false ? { background: '#fffbe6' } : {}}>
                    <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                    <td>{venta.usuarioEmail}</td>
                    <td>{venta.identificador || '-'}</td>
                    <td>{venta.cliente}</td>
                    <td>${(venta.monto || 0).toFixed(2)}</td>
                    <td>${(venta.comision || 0).toFixed(2)}</td>
                    <td>${(venta.profit || 0).toFixed(2)}</td>
                    <td>${(venta.feeVenta || 0).toFixed(2)}</td>
                    <td>
                      {venta.pago === false
                        ? <span style={{color:'#b8860b',fontWeight:600}}>No pagada</span>
                        : (
                          <div className="d-flex gap-2">
                            <FiEye style={{cursor: 'pointer'}} onClick={() => handleAbrirModal(venta)} />
                            <FiChevronDown 
                              style={{cursor: 'pointer', transform: ventaExpandidaId === venta.id ? 'rotate(180deg)' : 'rotate(0deg)'}} 
                              onClick={() => handleExpandirVenta(venta.id)} 
                            />
                          </div>
                        )}
                    </td>
                  </tr>,
                  ventaExpandidaId === venta.id && (
                    <tr key={venta.id + '-detalle'}>
                      <td colSpan={9} style={{ background: '#f8fafd', padding: 0 }}>
                        <div style={{ padding: 16 }}>
                          <strong>Detalle de productos vendidos:</strong>
                          <Table bordered hover size="sm" className="mt-2">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Costo</th>
                                <th>Precio Venta</th>
                                <th>Profit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(venta.productos || []).map((p, idx) => (
                                <tr key={p.id || idx}>
                                  <td>{p.description || p.nombre || p.name || '-'}</td>
                                  <td>{p.cantidad || 1}</td>
                                  <td>${Number(p.costo || 0).toFixed(2)}</td>
                                  <td>${Number(p.precioVenta || 0).toFixed(2)}</td>
                                  <td>${Number(p.profit || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </td>
                    </tr>
                  )
                ])}
                <tr style={{ background: '#f1f3f7', fontWeight: 'bold' }}>
                  <td colSpan={4} className="text-end">Totales:</td>
                  <td>${ventasTotales.toFixed(2)}</td>
                  <td>${comisionesTotales.toFixed(2)}</td>
                  <td>${profitTotales.toFixed(2)}</td>
                  <td>${cuentasPorCobrar.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      {/* Modal de detalle de venta */}
      <Modal show={mostrarModal} onHide={handleCerrarModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de la Venta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ventaSeleccionada ? (
            <>
              <div className="mb-3">
                <strong>Cliente:</strong> {ventaSeleccionada.cliente} <br />
                <strong>Usuario:</strong> {ventaSeleccionada.usuarioEmail} <br />
                <strong>Fecha:</strong> {ventaSeleccionada.fecha ? new Date(ventaSeleccionada.fecha).toLocaleDateString() : '-'}
              </div>
              <Table bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Costo</th>
                    <th>Precio Venta</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {(ventaSeleccionada.productos || []).map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td>{p.description || p.nombre || p.name || '-'}</td>
                      <td>{p.cantidad || 1}</td>
                      <td>${Number(p.costo || 0).toFixed(2)}</td>
                      <td>${Number(p.precioVenta || 0).toFixed(2)}</td>
                      <td>${Number(p.profit || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <div>No hay información de la venta.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCerrarModal}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard; 