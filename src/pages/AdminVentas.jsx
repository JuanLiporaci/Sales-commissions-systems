import React, { useEffect, useState } from 'react';
import { Table, Container, Row, Col, Form, Button } from 'react-bootstrap';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const AdminVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true);
      const ventasRef = collection(db, 'ventas');
      const q = query(ventasRef, orderBy('fechaRegistro', 'desc'));
      const querySnapshot = await getDocs(q);
      const ventasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVentas(ventasData);
      // Extraer usuarios únicos
      const usuariosUnicos = Array.from(new Set(ventasData.map(v => v.usuarioEmail).filter(Boolean)));
      setUsuarios(usuariosUnicos);
      setLoading(false);
    };
    fetchVentas();
  }, []);

  // Filtros
  const ventasFiltradas = ventas.filter(v => {
    const usuarioOk = filtroUsuario ? v.usuarioEmail === filtroUsuario : true;
    const fechaOk = filtroFecha ? (v.fechaRegistro && v.fechaRegistro.startsWith(filtroFecha)) : true;
    return usuarioOk && fechaOk;
  });

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Administración de Ventas</h2>
      <Row className="mb-3">
        <Col md={3}>
          <Form.Select value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)}>
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Control type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        </Col>
        <Col md={6} className="text-end">
          {/* Aquí puedes agregar botón de exportar a CSV/Excel en el futuro */}
          <Button variant="outline-primary" disabled title="Próximamente">Exportar CSV</Button>
        </Col>
      </Row>
      <div className="table-responsive">
        <Table striped bordered hover size="sm" className="table-modern">
          <thead className="table-light">
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Monto</th>
              <th>Comisión</th>
              <th>Método de Pago</th>
              <th>Tipo de Pago</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center">Cargando ventas...</td></tr>
            ) : ventasFiltradas.length === 0 ? (
              <tr><td colSpan={8} className="text-center">No hay ventas para los filtros seleccionados</td></tr>
            ) : ventasFiltradas.map(venta => (
              <tr key={venta.id} style={venta.pago === false ? { background: '#fffbe6' } : {}}>
                <td>{venta.fechaRegistro ? new Date(venta.fechaRegistro).toLocaleDateString() : ''}</td>
                <td>{venta.usuarioEmail}</td>
                <td>{venta.cliente}</td>
                <td>{(venta.productos || []).map(p => p.description).join(', ')}</td>
                <td>${Number(venta.monto).toFixed(2)}</td>
                <td>${Number(venta.comision).toFixed(2)}</td>
                <td>{venta.metodoPago || ''}</td>
                <td>{venta.tipoPago || ''}{venta.pago === false ? ' (No pagada)' : ''}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

export default AdminVentas; 