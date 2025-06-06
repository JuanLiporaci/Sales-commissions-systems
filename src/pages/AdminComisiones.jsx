import React, { useEffect, useState } from 'react';
import { Card, Table, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { FiDollarSign, FiUser, FiCheckCircle } from 'react-icons/fi';
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
      <h2 className="mb-4">Comisiones</h2>
      {alerta && <Alert variant="success">{alerta}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
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
                  <small>Comisiones por usuario</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col md={3}>
          <Form.Select value={usuarioFiltro} onChange={e => setUsuarioFiltro(e.target.value)}>
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Control type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} placeholder="Desde" />
        </Col>
        <Col md={3}>
          <Form.Control type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} placeholder="Hasta" />
        </Col>
        <Col md={3} className="text-end">
          <Button variant="outline-success" onClick={marcarTodasComoPagadas} disabled={comisionesPorUsuario.length === 0}>
            <FiCheckCircle className="me-2" /> Marcar todas como pagadas
          </Button>
        </Col>
      </Row>
      <Card className="shadow-sm">
        <Card.Body>
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
                <tr><td colSpan={8} className="text-center">No hay comisiones por pagar</td></tr>
              ) : comisionesPorUsuario.map(v => (
                <tr key={v.id}>
                  <td>{v.usuarioEmail}</td>
                  <td>{v.identificador || '-'}</td>
                  <td>{v.cliente}</td>
                  <td>{v.fecha ? new Date(v.fecha).toLocaleDateString() : ''}</td>
                  <td>${Number(v.monto).toFixed(2)}</td>
                  <td>${Number(v.comision).toFixed(2)}</td>
                  <td>${Number(v.feeVenta || 0).toFixed(2)}</td>
                  <td>
                    <Button size="sm" variant="success" onClick={async () => {
                      await updateDoc(doc(db, 'ventas', v.id), { comisionPagada: true, feeVenta: 0 });
                      setVentas(ventas.map(venta => venta.id === v.id ? { ...venta, comisionPagada: true, feeVenta: 0 } : venta));
                      setAlerta('¡Comisión marcada como pagada!');
                      setTimeout(() => setAlerta(''), 2000);
                    }} disabled={v.comisionPagada}>
                      {v.comisionPagada ? 'Pagada' : 'Marcar como pagada'}
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