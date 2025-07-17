import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Table, Card } from 'react-bootstrap';
import { FiFileText, FiSearch, FiDownload } from 'react-icons/fi';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { exportObjectsToExcel } from '../utils/excelExport.js';

const Despachos = () => {
  const { user } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('');
  const [filtroTipoPago, setFiltroTipoPago] = useState('');
  const [distribuidorMap, setDistribuidorMap] = useState({});

  useEffect(() => {
    const fetchVentas = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      try {
        const ventasRef = collection(db, 'ventas');
        const q = query(
          ventasRef,
          where('usuarioEmail', '==', user.email),
          orderBy('fechaRegistro', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const ventasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVentas(ventasData);
      } catch (err) {
        console.error('Error cargando ventas:', err);
      }
      setLoading(false);
    };

    fetchVentas();
  }, [user]);

  // Filtros
  const ventasFiltradas = ventas.filter(venta => {
    // Filtro por cliente
    const clienteOk = !filtroCliente.trim() || 
      (venta.cliente && venta.cliente.toLowerCase().includes(filtroCliente.toLowerCase()));
    
    // Filtro por fecha
    const fechaOk = !filtroFecha || 
      (venta.fecha && new Date(venta.fecha).toLocaleDateString() === new Date(filtroFecha).toLocaleDateString());
    
    // Filtro por método de pago
    const metodoOk = !filtroMetodoPago || 
      (venta.metodoPago && venta.metodoPago === filtroMetodoPago);
    
    // Filtro por tipo de pago
    const tipoOk = !filtroTipoPago || 
      (venta.tipoPago && venta.tipoPago === filtroTipoPago);
    
    return clienteOk && fechaOk && metodoOk && tipoOk;
  });

  // Handler para cambiar el distribuidor
  const handleDistribuidorChange = async (ventaId, newDistribuidor) => {
    setVentas(prev => prev.map(v => v.id === ventaId ? { ...v, distribuidor: newDistribuidor } : v));
    setDistribuidorMap(prev => ({ ...prev, [ventaId]: newDistribuidor }));
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const ventaRef = doc(db, 'ventas', ventaId);
      await updateDoc(ventaRef, { distribuidor: newDistribuidor });
    } catch (err) {
      console.error('Error actualizando distribuidor:', err);
    }
  };

  // Exportar a Excel
  const exportarExcel = async () => {
    const data = ventasFiltradas.map(venta => {
      const productos = (venta.productos || []).map(prod => 
        `${prod.description || prod.nombre || prod.name || ''}${prod.cantidad ? ` (${prod.cantidad})` : ''}`
      ).join('\n');
      
      return {
        'Fecha': venta.fecha ? new Date(venta.fecha).toLocaleDateString() : '',
        'Cliente': venta.cliente || '',
        'Dirección': venta.direccionCliente || '',
        'Productos': productos,
        'Monto': venta.monto || 0,
        'Método de Pago': venta.metodoPago || '',
        'Tipo de Pago': venta.tipoPago || '',
        'Distribuidor': venta.distribuidor || '',
        'Notas': venta.notas || ''
      };
    });
    
    await exportObjectsToExcel(data, `despachos_${user.email}_${new Date().toISOString().split('T')[0]}.xlsx`, 'Despachos');
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Mis Despachos</h2>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <FiFileText className="me-2 text-primary" />
            <h5 className="mb-0">Despachos</h5>
            <div className="ms-auto d-flex align-items-center gap-2">
              <Form.Control
                type="text"
                placeholder="Filtrar por cliente..."
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="form-control-sm"
                style={{ width: 150 }}
              />
              <Form.Control
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="form-control-sm"
                style={{ width: 140 }}
              />
              <Form.Select
                value={filtroMetodoPago}
                onChange={(e) => setFiltroMetodoPago(e.target.value)}
                className="form-control-sm"
                style={{ width: 120 }}
              >
                <option value="">Método</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
                <option value="Multipago">Multipago</option>
              </Form.Select>
              <Form.Select
                value={filtroTipoPago}
                onChange={(e) => setFiltroTipoPago(e.target.value)}
                className="form-control-sm"
                style={{ width: 120 }}
              >
                <option value="">Tipo</option>
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
              </Form.Select>
              <Button 
                variant="outline-success" 
                size="sm" 
                onClick={exportarExcel}
                disabled={ventasFiltradas.length === 0}
              >
                <FiDownload className="me-1" /> Exportar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">Cargando despachos...</div>
          ) : ventasFiltradas.length === 0 ? (
            <div className="text-center py-5">No hay despachos registrados</div>
          ) : (
            <div className="table-responsive">
              <Table responsive hover className="mb-0 table-modern">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Dirección</th>
                    <th>Productos</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Tipo</th>
                    <th>Distribuidor</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map(venta => (
                    <tr key={venta.id}>
                      <td>{venta.fecha ? new Date(venta.fecha).toLocaleDateString() : ''}</td>
                      <td>{venta.cliente}</td>
                      <td style={{ whiteSpace: 'pre-line' }}>{venta.direccionCliente || ''}</td>
                      <td style={{ whiteSpace: 'pre-line' }}>
                        {(venta.productos || []).map(prod => 
                          `${prod.description || prod.nombre || prod.name || ''}${prod.cantidad ? ` (${prod.cantidad})` : ''}`
                        ).join('\n')}
                      </td>
                      <td>${(venta.monto || 0).toFixed(2)}</td>
                      <td>{venta.metodoPago || ''}</td>
                      <td>{venta.tipoPago || ''}</td>
                      <td>
                        <Form.Control
                          type="text"
                          value={distribuidorMap[venta.id] || venta.distribuidor || ''}
                          onChange={(e) => handleDistribuidorChange(venta.id, e.target.value)}
                          placeholder="Nombre distribuidor"
                          size="sm"
                          style={{ fontSize: 14 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="4" className="fw-bold">Totales {filtroCliente || filtroFecha || filtroMetodoPago || filtroTipoPago ? '(filtrados)' : ''}:</td>
                    <td className="fw-bold">${ventasFiltradas.reduce((sum, venta) => sum + (venta.monto || 0), 0).toFixed(2)}</td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Despachos; 