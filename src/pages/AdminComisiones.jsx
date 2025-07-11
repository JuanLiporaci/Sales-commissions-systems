import React, { useEffect, useState } from 'react';
import { Card, Table, Row, Col, Form, Button, Alert, ButtonGroup } from 'react-bootstrap';
import { FiDollarSign, FiUser, FiCheckCircle, FiCalendar } from 'react-icons/fi';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';

const AdminComisiones = () => {
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [error, setError] = useState('');
  const [alerta, setAlerta] = useState('');
  const [quincenaSeleccionada, setQuincenaSeleccionada] = useState('');

  // Función para obtener fechas de quincenas
  const obtenerFechasQuincena = (mes, anio, quincena) => {
    const fechaInicio = new Date(anio, mes, quincena === 1 ? 1 : 16);
    let fechaFin;
    
    if (quincena === 1) {
      fechaFin = new Date(anio, mes, 15);
    } else {
      // Para la segunda quincena, ir hasta el último día del mes
      fechaFin = new Date(anio, mes + 1, 0);
    }
    
    return {
      inicio: fechaInicio.toISOString().split('T')[0],
      fin: fechaFin.toISOString().split('T')[0]
    };
  };

  // Función para generar opciones de quincenas (últimos 6 meses)
  const generarOpcionesQuincenas = () => {
    const opciones = [];
    const hoy = new Date();
    
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mes = fecha.getMonth();
      const anio = fecha.getFullYear();
      const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      opciones.push({
        value: `${anio}-${mes}-1`,
        label: `1ra quincena ${nombreMes}`,
        fechas: obtenerFechasQuincena(mes, anio, 1)
      });
      
      opciones.push({
        value: `${anio}-${mes}-2`,
        label: `2da quincena ${nombreMes}`,
        fechas: obtenerFechasQuincena(mes, anio, 2)
      });
    }
    
    return opciones;
  };

  const opcionesQuincenas = generarOpcionesQuincenas();

  // Función para aplicar filtro de quincena
  const aplicarFiltroQuincena = (valor) => {
    setQuincenaSeleccionada(valor);
    
    if (valor) {
      const opcion = opcionesQuincenas.find(op => op.value === valor);
      if (opcion) {
        setFechaInicio(opcion.fechas.inicio);
        setFechaFin(opcion.fechas.fin);
      }
    } else {
      setFechaInicio('');
      setFechaFin('');
    }
  };

  // Función para establecer quincena actual
  const establecerQuincenaActual = () => {
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();
    const quincena = dia <= 15 ? 1 : 2;
    
    const valor = `${anio}-${mes}-${quincena}`;
    aplicarFiltroQuincena(valor);
  };

  useEffect(() => {
    const fetchVentas = async () => {
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
    };
    fetchVentas();
  }, []);

  // Filtrar ventas pagadas pero comisión no pagada, y por fecha
  const comisionesPorPagar = ventas.filter(v => {
    const usuarioOk = !usuarioFiltro || v.usuarioEmail === usuarioFiltro;
    let fechaOk = true;
    if (fechaInicio) {
      const fechaVenta = v.fecha ? new Date(v.fecha) : null;
      const inicio = new Date(fechaInicio);
      if (fechaVenta && fechaVenta < inicio) fechaOk = false;
    }
    if (fechaFin) {
      const fechaVenta = v.fecha ? new Date(v.fecha) : null;
      const fin = new Date(fechaFin);
      fin.setDate(fin.getDate() + 1); // incluir el día completo
      if (fechaVenta && fechaVenta >= fin) fechaOk = false;
    }
    return v.pago === true && v.comision > 0 && !v.comisionPagada && usuarioOk && fechaOk;
  });
  const totalComisionesPorPagar = comisionesPorPagar.reduce((sum, v) => sum + (parseFloat(v.comision) || 0), 0);

  // Comisiones por usuario
  const comisionesPorUsuario = usuarioFiltro
    ? comisionesPorPagar.filter(v => v.usuarioEmail === usuarioFiltro)
    : comisionesPorPagar;
  const totalComisionesUsuario = comisionesPorUsuario.reduce((sum, v) => sum + (parseFloat(v.comision) || 0), 0);

  const marcarTodasComoPagadas = async () => {
    try {
      await Promise.all(comisionesPorUsuario.map(v => updateDoc(doc(db, 'ventas', v.id), { comisionPagada: true })));
      setVentas(ventas.map(v => (comisionesPorUsuario.some(c => c.id === v.id) ? { ...v, comisionPagada: true } : v)));
      setAlerta('¡Todas las comisiones marcadas como pagadas!');
      setTimeout(() => setAlerta(''), 2000);
    } catch (err) {
      setError('Error al marcar todas las comisiones');
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 d-flex align-items-center">
        <FiDollarSign className="me-2 text-success" />
        Administración de Comisiones Quincenales
      </h2>
      {alerta && <Alert variant="success">{alerta}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Tarjetas de resumen */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <div className="d-flex align-items-center">
                <FiDollarSign className="me-3 text-success" size={32} />
                <div>
                  <h5 className="mb-0">${totalComisionesPorPagar.toFixed(2)}</h5>
                  <small>Comisiones totales por pagar</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <div className="d-flex align-items-center">
                <FiUser className="me-3 text-primary" size={32} />
                <div>
                  <h5 className="mb-0">${totalComisionesUsuario.toFixed(2)}</h5>
                  <small>Comisiones {usuarioFiltro ? 'del usuario seleccionado' : 'filtradas'}</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros de quincenas */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <FiCalendar className="me-2" />
            Filtros por Quincenas
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Label>Seleccionar Quincena</Form.Label>
              <Form.Select 
                value={quincenaSeleccionada} 
                onChange={e => aplicarFiltroQuincena(e.target.value)}
              >
                <option value="">Seleccionar período...</option>
                {opcionesQuincenas.map(opcion => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <ButtonGroup>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={establecerQuincenaActual}
                >
                  Quincena Actual
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => aplicarFiltroQuincena('')}
                >
                  Limpiar Filtro
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
          
          {quincenaSeleccionada && (
            <Alert variant="info" className="mb-0">
              <strong>Período seleccionado:</strong> {opcionesQuincenas.find(op => op.value === quincenaSeleccionada)?.label}
              <br />
              <strong>Fechas:</strong> {fechaInicio} al {fechaFin}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Filtros adicionales */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Label>Usuario</Form.Label>
          <Form.Select value={usuarioFiltro} onChange={e => setUsuarioFiltro(e.target.value)}>
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Label>Fecha Inicio (Manual)</Form.Label>
          <Form.Control 
            type="date" 
            value={fechaInicio} 
            onChange={e => {
              setFechaInicio(e.target.value);
              setQuincenaSeleccionada(''); // Limpiar selección de quincena
            }} 
            placeholder="Desde" 
          />
        </Col>
        <Col md={3}>
          <Form.Label>Fecha Fin (Manual)</Form.Label>
          <Form.Control 
            type="date" 
            value={fechaFin} 
            onChange={e => {
              setFechaFin(e.target.value);
              setQuincenaSeleccionada(''); // Limpiar selección de quincena
            }} 
            placeholder="Hasta" 
          />
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button 
            variant="success" 
            onClick={marcarTodasComoPagadas} 
            disabled={comisionesPorUsuario.length === 0}
            className="w-100"
          >
            <FiCheckCircle className="me-2" /> 
            Pagar Todas ({comisionesPorUsuario.length})
          </Button>
        </Col>
      </Row>

      {/* Tabla de comisiones */}
      <Card className="shadow-sm">
        <Card.Body>
          {comisionesPorUsuario.length > 0 && (
            <div className="mb-3 p-3 bg-light rounded">
              <Row>
                <Col md={6}>
                  <strong>Resumen del período:</strong>
                  <br />
                  <span className="text-muted">
                    {comisionesPorUsuario.length} comisiones por un total de ${totalComisionesUsuario.toFixed(2)}
                  </span>
                </Col>
                <Col md={6} className="text-end">
                  {usuarioFiltro && (
                    <>
                      <strong>Usuario:</strong> {usuarioFiltro}
                      <br />
                    </>
                  )}
                  {fechaInicio && fechaFin && (
                    <span className="text-muted">
                      Período: {new Date(fechaInicio).toLocaleDateString()} - {new Date(fechaFin).toLocaleDateString()}
                    </span>
                  )}
                </Col>
              </Row>
            </div>
          )}
          
          <Table responsive hover className="mb-0 table-modern">
            <thead className="table-light">
              <tr>
                <th>Usuario</th>
                <th>Identificador</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Monto Venta</th>
                <th>Comisión</th>
                <th>Fee de venta</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {comisionesPorUsuario.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    {fechaInicio || fechaFin || usuarioFiltro ? 
                      'No hay comisiones por pagar en el período/usuario seleccionado' : 
                      'No hay comisiones por pagar'
                    }
                  </td>
                </tr>
              ) : comisionesPorUsuario.map(v => (
                <tr key={v.id}>
                  <td>{v.usuarioEmail}</td>
                  <td>{v.identificador || '-'}</td>
                  <td>{v.cliente}</td>
                  <td>{v.fecha ? new Date(v.fecha).toLocaleDateString() : ''}</td>
                  <td>${Number(v.monto).toFixed(2)}</td>
                  <td className="text-success fw-bold">${Number(v.comision).toFixed(2)}</td>
                  <td>${Number(v.feeVenta || 0).toFixed(2)}</td>
                  <td>
                    <Button size="sm" variant="success" onClick={async () => {
                      await updateDoc(doc(db, 'ventas', v.id), { comisionPagada: true, feeVenta: 0 });
                      setVentas(ventas.map(venta => venta.id === v.id ? { ...venta, comisionPagada: true, feeVenta: 0 } : venta));
                      setAlerta('¡Comisión marcada como pagada!');
                      setTimeout(() => setAlerta(''), 2000);
                    }} disabled={v.comisionPagada}>
                      {v.comisionPagada ? 'Pagada' : 'Pagar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminComisiones; 