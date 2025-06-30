import React, { useEffect, useState } from 'react';
import { Card, Table, Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import Select from 'react-select';
import { FiUsers, FiFileText, FiSearch, FiDownload } from 'react-icons/fi';
import { exportObjectsToExcel } from '../utils/excelExport.js';

const DespachosAdmin = () => {
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(true);
  const [driverOptions, setDriverOptions] = useState([]);
  const [driverMap, setDriverMap] = useState({});

  // Cargar ventas y usuarios
  useEffect(() => {
    const fetchVentasYUsuarios = async () => {
      setLoading(true);
      try {
        // Ventas
        const ventasRef = collection(db, 'ventas');
        const q = query(ventasRef, orderBy('fechaRegistro', 'desc'));
        const querySnapshot = await getDocs(q);
        const ventasFirestore = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setVentas(ventasFirestore);
        // Usuarios únicos de ventas
        const usuariosUnicos = Array.from(new Set(ventasFirestore.map(v => v.usuarioEmail)));
        setUsuarios(usuariosUnicos);
      } catch (err) {
        setVentas([]);
        setUsuarios([]);
      }
      setLoading(false);
    };
    fetchVentasYUsuarios();
  }, []);

  // Cargar drivers (usuarios de Firestore)
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const usuariosRef = collection(db, 'usuarios');
        const q = query(usuariosRef, orderBy('displayName'));
        const querySnapshot = await getDocs(q);
        const driversFirestore = querySnapshot.docs.map(doc => ({
          value: doc.data().email,
          label: doc.data().displayName || doc.data().email
        }));
        setDriverOptions(driversFirestore);
        // Mapeo de email a displayName
        const map = {};
        querySnapshot.docs.forEach(doc => {
          map[doc.data().email] = doc.data().displayName || doc.data().email;
        });
        setDriverMap(map);
      } catch (err) {
        setDriverOptions([]);
        setDriverMap({});
      }
    };
    fetchDrivers();
  }, []);

  // Filtros
  const ventasFiltradas = ventas.filter(v => {
    const usuarioOk = usuariosSeleccionados.length === 0 || usuariosSeleccionados.includes(v.usuarioEmail);
    let fechaOk = true;
    if (fechaInicio) {
      const fechaVenta = v.fechaRegistro ? new Date(v.fechaRegistro) : null;
      const inicio = new Date(fechaInicio);
      if (fechaVenta && fechaVenta < inicio) fechaOk = false;
    }
    if (fechaFin) {
      const fechaVenta = v.fechaRegistro ? new Date(v.fechaRegistro) : null;
      const fin = new Date(fechaFin);
      fin.setDate(fin.getDate() + 1);
      if (fechaVenta && fechaVenta >= fin) fechaOk = false;
    }
    return usuarioOk && fechaOk;
  });

  // Handler para cambiar el driver de una venta
  const handleDriverChange = async (ventaId, newDriver) => {
    setVentas(prev => prev.map(v => v.id === ventaId ? { ...v, driver: newDriver } : v));
    try {
      const ventaRef = doc(db, 'ventas', ventaId);
      await updateDoc(ventaRef, { driver: newDriver });
    } catch (err) {
      // Manejo de error opcional
    }
  };

  // Opciones para react-select de usuarios
  const opcionesUsuarios = usuarios.map(u => ({ value: u, label: u }));

  // Exportar Excel con filtro
  const exportarExcelConFiltro = async () => {
    // Formato: Address/Company Name, Address line 1, Internal notes, Código, Driver
    const data = ventasFiltradas.flatMap(venta =>
      (venta.productos || []).map(prod => {
        // Determinar nombre del driver
        let driverEmail = venta.driver || venta.usuarioEmail || '';
        let driverName = driverMap[driverEmail] || driverEmail;
        return {
          'Address/Company Name': venta.cliente,
          'Address line 1': venta.direccionCliente || '',
          'Internal notes': `${prod.description || prod.nombre || prod.name || ''}${prod.cantidad ? ` (${prod.cantidad})` : ''}`,
          'Código': prod.code || prod.id || '',
          'Driver': driverName,
          'Notas': venta.notas || ''
        };
      })
    );
    await exportObjectsToExcel(data, `despachos_filtrados_${new Date().toISOString().split('T')[0]}.xlsx`, 'Despachos');
  };

  // Exportar Excel formato Despacho
  const exportarExcelDespacho = async () => {
    // Agrupa productos por venta en una sola fila
    const data = ventasFiltradas.map(venta => {
      const productos = (venta.productos || []).map(prod => `${prod.description || prod.nombre || prod.name || ''}${prod.cantidad ? ` (${prod.cantidad})` : ''}`).join('\n');
      const codigos = (venta.productos || []).map(prod => prod.code || prod.id || '').join('\n');
      let driverEmail = venta.driver || venta.usuarioEmail || '';
      let driverName = driverMap[driverEmail] || driverEmail;
      return {
        'Address/Company Name': venta.cliente,
        'Address line 1': venta.direccionCliente || '',
        'Internal notes': productos,
        'Código': codigos,
        'Driver': driverName,
        'Fecha de despacho': venta.fechaRegistro ? new Date(venta.fechaRegistro).toLocaleDateString() : '',
        'Notas': venta.notas || ''
      };
    });
    await exportObjectsToExcel(data, `despacho_filtrado_${new Date().toISOString().split('T')[0]}.xlsx`, 'Despacho');
  };

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ color: '#1a237e', fontWeight: 700 }}>Gestión de Despachos</h2>
      <Card className="shadow-sm mb-4 mt-4">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <FiFileText className="me-2 text-primary" />
            <h5 className="mb-0">Despachos (Pedidos)</h5>
            <div className="ms-auto d-flex align-items-center gap-2" style={{ width: 'auto' }}>
              <span style={{ color: '#888', fontWeight: 500, marginRight: 12, minWidth: 120, fontSize: 14 }}>Filtrar usuarios</span>
              <div style={{ width: 240, marginRight: 12 }}>
                <Select
                  isMulti
                  options={opcionesUsuarios}
                  value={opcionesUsuarios.filter(opt => usuariosSeleccionados.includes(opt.value))}
                  onChange={selected => setUsuariosSeleccionados(selected ? selected.map(opt => opt.value) : [])}
                  placeholder="Seleccionar usuarios"
                  noOptionsMessage={() => 'Sin usuarios'}
                  styles={{ control: base => ({ ...base, minHeight: 32, fontSize: 14 }), menu: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
              <Form.Control
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                style={{ width: 120, marginRight: 8, fontSize: 14, height: 32, padding: '2px 8px' }}
              />
              <Form.Control
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                style={{ width: 120, marginRight: 8, fontSize: 14, height: 32, padding: '2px 8px' }}
              />
              <Button variant="success" size="sm" style={{ marginLeft: 12 }} onClick={exportarExcelConFiltro}>
                <FiDownload className="me-1" /> Cricuit
              </Button>
              <Button variant="primary" size="sm" style={{ marginLeft: 8 }} onClick={exportarExcelDespacho}>
                <FiDownload className="me-1" /> Despacho
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando despachos...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table responsive hover className="mb-0 table-modern" style={{ fontSize: 14, minWidth: 900 }}>
                <thead className="table-light">
                  <tr style={{ verticalAlign: 'middle' }}>
                    <th style={{ minWidth: 90, padding: '8px 6px' }}>Fecha</th>
                    <th style={{ minWidth: 120, padding: '8px 6px' }}>Usuario</th>
                    <th style={{ minWidth: 90, padding: '8px 6px' }}>Identificador</th>
                    <th style={{ minWidth: 160, padding: '8px 6px' }}>Cliente</th>
                    <th style={{ minWidth: 180, padding: '8px 6px' }}>Dirección</th>
                    <th style={{ minWidth: 160, padding: '8px 6px' }}>Producto</th>
                    <th style={{ minWidth: 60, padding: '8px 6px', textAlign: 'center' }}>Cantidad</th>
                    <th style={{ minWidth: 120, padding: '8px 6px' }}>Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 ? (
                    <tr><td colSpan={8} className="text-center">No hay despachos registrados</td></tr>
                  ) : (
                    ventasFiltradas.flatMap(venta => (
                      (venta.productos || []).map((prod, idx) => (
                        <tr key={venta.id + '-' + idx} style={{ verticalAlign: 'middle' }}>
                          <td style={{ padding: '6px 6px' }}>{venta.fechaRegistro ? new Date(venta.fechaRegistro).toLocaleDateString() : ''}</td>
                          <td style={{ padding: '6px 6px' }}>{venta.usuarioEmail}</td>
                          <td style={{ padding: '6px 6px' }}>{venta.identificador || ''}</td>
                          <td style={{ padding: '6px 6px' }}>{venta.cliente}</td>
                          <td style={{ padding: '6px 6px', whiteSpace: 'pre-line' }}>{venta.direccionCliente || ''}</td>
                          <td style={{ padding: '6px 6px', whiteSpace: 'pre-line' }}>{prod.description || prod.nombre || prod.name || ''}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'center' }}>{prod.cantidad || 1}</td>
                          <td style={{ minWidth: 120, padding: '6px 6px' }}>
                            <Select
                              options={driverOptions}
                              value={driverOptions.find(opt => opt.value === (venta.driver || venta.usuarioEmail)) || { value: venta.driver || venta.usuarioEmail, label: venta.driver || venta.usuarioEmail }}
                              onChange={opt => handleDriverChange(venta.id, opt.value)}
                              onInputChange={inputValue => {
                                if (inputValue && !driverOptions.some(opt => opt.value === inputValue)) {
                                  setDriverOptions(prev => ([...prev, { value: inputValue, label: inputValue }]));
                                }
                              }}
                              isClearable
                              placeholder="Seleccionar driver"
                              noOptionsMessage={() => 'Sin opciones'}
                              styles={{ control: base => ({ ...base, minHeight: 28, fontSize: 14 }), menu: base => ({ ...base, zIndex: 9999 }) }}
                            />
                          </td>
                        </tr>
                      ))
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default DespachosAdmin; 