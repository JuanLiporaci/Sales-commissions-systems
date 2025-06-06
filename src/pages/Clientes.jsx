import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { FiPlus, FiUsers, FiShoppingBag, FiHome, FiBarChart2, FiMapPin, FiSettings, FiLogOut, FiMenu, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { logout } from '../services/auth.ts';

const Clientes = () => {
  const navigate = useNavigate();
  const userLS = JSON.parse(localStorage.getItem('user')) || {};
  const { user: authUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contactName: '',
    contactPhone: '',
    email: '',
    notes: ''
  });
  const [alerta, setAlerta] = useState(null);
  const [clientes, setClientes] = useState([]);

  // Combinar datos de usuario de localStorage y AuthContext
  const userData = {
    ...userLS,
    ...authUser,
    displayName: userLS.displayName || (authUser?.displayName || ''),
    photoURL: userLS.photoURL || (authUser?.photoURL || ''),
    identificador: userLS.identificador || (authUser?.identificador || '')
  };
  
  // Leer clientes desde Firestore o caché al cargar
  useEffect(() => {
    async function fetchClientes() {
      try {
        const locations = await import('../services/locations.js').then(m => m.locationsService.getAllLocations());
        setClientes(locations);
        localStorage.setItem('clientes', JSON.stringify(locations));
      } catch (err) {
        setClientes([]);
      }
    }
    const cachedClientes = localStorage.getItem('clientes');
    if (cachedClientes) {
      setClientes(JSON.parse(cachedClientes));
    } else {
      fetchClientes();
    }
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.address) {
      setAlerta({ tipo: 'danger', mensaje: 'Nombre y dirección son obligatorios.' });
      return;
    }
    try {
      await addDoc(collection(db, 'delivery_locations'), {
        ...form,
        createdAt: new Date().toISOString(),
        createdBy: userData.email || ''
      });
      setAlerta({ tipo: 'success', mensaje: 'Cliente agregado correctamente.' });
      setForm({ name: '', address: '', city: '', state: '', zipCode: '', contactName: '', contactPhone: '', email: '', notes: '' });
      // Actualizar caché de clientes
      const updatedClientes = [...clientes, { ...form, createdAt: new Date().toISOString(), createdBy: userData.email || '' }];
      setClientes(updatedClientes);
      localStorage.setItem('clientes', JSON.stringify(updatedClientes));
    } catch (err) {
      setAlerta({ tipo: 'danger', mensaje: 'Error al guardar el cliente.' });
    }
  };
  
  const navegarA = (ruta) => {
    navigate(ruta);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={isMobile ? { width: sidebarOpen ? '80vw' : 0, zIndex: 2000, position: 'fixed', left: 0, top: 0, height: '100vh', background: '#1a237e', transition: 'width 0.3s' } : {}}>
        <div className="sidebar-header" style={{ position: 'relative' }}>
          <h2 className="sidebar-logo">Ventas MVP</h2>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 28, zIndex: 2100 }}
              aria-label="Cerrar menú"
            >
              {sidebarOpen ? '✖' : '☰'}
            </button>
          )}
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            {userData.photoURL ? (
              <img src={userData.photoURL} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
            ) : (
              userData.displayName ? userData.displayName[0].toUpperCase() : 'U'
            )}
          </div>
          <div className="user-info">
            <h6>{userData.displayName || 'Usuario'}</h6>
            <small>{userData.identificador ? userData.identificador : userData.email}</small>
          </div>
        </div>
        
        <nav className="sidebar-nav flex-column">
          <button 
            className="sidebar-link" 
            onClick={() => navegarA('/')}
          >
            <FiHome className="nav-icon" /> <span>Inicio</span>
          </button>
          <button 
            className="sidebar-link" 
            onClick={() => navegarA('/ventas')}
          >
            <FiShoppingBag className="nav-icon" /> <span>Ventas</span>
          </button>
          <button className="sidebar-link" onClick={() => navegarA('/forecast')}>
            <FiBarChart2 className="nav-icon" /> <span>Forecast</span>
          </button>
          <button className="sidebar-link active" onClick={() => navegarA('/clientes')}>
            <FiUsers className="nav-icon" /> <span>Clientes</span>
          </button>
          <button 
            className="sidebar-link"
            onClick={() => navegarA('/locations')}
          >
            <FiMapPin className="nav-icon" /> <span>Ubicaciones</span>
          </button>
          <button className="sidebar-link" onClick={() => navegarA('/estadisticas')}>
            <FiBarChart2 className="nav-icon" /> <span>Estadísticas</span>
          </button>
          <button className="sidebar-link" onClick={() => navegarA('/metricas-financieras')}>
            <FiTrendingUp className="nav-icon" /> <span>Métricas Financieras</span>
          </button>
          <button className="sidebar-link" onClick={() => navegarA('/configuracion')}>
            <FiSettings className="nav-icon" /> <span>Configuración</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button 
            className="sidebar-link logout-link"
            onClick={handleLogout}
          >
            <FiLogOut className="nav-icon" /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {isMobile && sidebarOpen && (
        <div onClick={toggleSidebar} style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1999 }} />
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-navbar">
          <div className="navbar-content">
            <div className="d-flex align-items-center">
              <h4 className="mb-0">Clientes</h4>
            </div>
            <div className="navbar-user d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                size="sm"
                className="toggle-sidebar-btn me-2"
                onClick={toggleSidebar}
                title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
              >
                <FiMenu />
              </Button>
              <span>{userData.displayName || userData.email}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <h2 className="dashboard-title mb-4">Clientes</h2>
          <Container className="py-4">
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h4 className="mb-4 d-flex align-items-center"><FiUsers className="me-2 text-primary" /> Agregar Cliente</h4>
                    {alerta && <Alert variant={alerta.tipo} onClose={() => setAlerta(null)} dismissible>{alerta.mensaje}</Alert>}
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nombre del Cliente *</Form.Label>
                        <Form.Control name="name" value={form.name} onChange={handleChange} required />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Dirección *</Form.Label>
                        <Form.Control name="address" value={form.address} onChange={handleChange} required />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Ciudad</Form.Label>
                        <Form.Control name="city" value={form.city} onChange={handleChange} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Estado</Form.Label>
                        <Form.Control name="state" value={form.state} onChange={handleChange} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Código Postal</Form.Label>
                        <Form.Control name="zipCode" value={form.zipCode} onChange={handleChange} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Nombre de Contacto</Form.Label>
                        <Form.Control name="contactName" value={form.contactName} onChange={handleChange} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Teléfono de Contacto</Form.Label>
                        <Form.Control name="contactPhone" value={form.contactPhone} onChange={handleChange} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control name="email" value={form.email} onChange={handleChange} type="email" />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Notas</Form.Label>
                        <Form.Control name="notes" value={form.notes} onChange={handleChange} as="textarea" rows={2} />
                      </Form.Group>
                      <div className="d-flex justify-content-end">
                        <Button type="submit" variant="primary" className="px-4 py-2 rounded-pill">
                          <FiPlus className="me-2" /> Agregar Cliente
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </main>
    </div>
  );
};

export default Clientes; 