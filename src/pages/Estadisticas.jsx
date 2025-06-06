import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { FiBarChart2, FiDollarSign, FiUsers, FiTag, FiTrendingUp, FiHome, FiShoppingBag, FiMapPin, FiSettings, FiLogOut, FiMenu } from 'react-icons/fi';
import { salesService } from '../services/sales.ts';
import { forecastsService } from '../services/forecasts.js';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const Estadisticas = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Función para traer ventas con caché en localStorage
  async function cargarVentasFirestore(usuarioEmail) {
    const cacheKey = `ventas_${usuarioEmail}`;
    const cacheTTL = 5 * 60 * 1000; // 5 minutos
    const cache = localStorage.getItem(cacheKey);
    if (cache) {
      const { data, timestamp } = JSON.parse(cache);
      if (Date.now() - timestamp < cacheTTL) {
        return data;
      }
    }
    const ventasRef = collection(db, 'ventas');
    const q = query(
      ventasRef,
      where('usuarioEmail', '==', usuarioEmail),
      orderBy('fechaRegistro', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const ventasFirestore = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    localStorage.setItem(cacheKey, JSON.stringify({ data: ventasFirestore, timestamp: Date.now() }));
    return ventasFirestore;
  }

  useEffect(() => {
    async function fetchData() {
      if (!user?.email) return;
      const ventasData = await cargarVentasFirestore(user.email);
      const forecastsData = await forecastsService.getAllForecasts(user.email);
      setVentas(ventasData);
      setForecasts(forecastsData);
    }
    fetchData();
  }, [user.email]);

  // KPIs básicos
  const totalVentas = ventas.length;
  const totalPronosticos = forecasts.length;
  const totalClientes = new Set(ventas.map(v => v.cliente)).size;
  const totalProductos = ventas.reduce((acc, v) => acc + (v.productos?.length || 0), 0);
  const totalMonto = ventas.reduce((acc, v) => acc + (Number(v.monto) || 0), 0);
  const ticketPromedio = totalVentas > 0 ? (totalMonto / totalVentas).toFixed(2) : 0;

  // Placeholders visuales
  const noVentas = totalVentas === 0;
  const noPronosticos = totalPronosticos === 0;
  const noClientes = totalClientes === 0;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={isMobile ? { width: sidebarOpen ? '80vw' : 0, zIndex: 2000, position: 'fixed', left: 0, top: 0, height: '100vh', background: '#1a237e', transition: 'width 0.3s' } : {}}>
        <div className="sidebar-header" style={{ position: 'relative' }}>
          <h2 className="sidebar-logo">Ventas MVP</h2>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 28, zIndex: 2100 }}
              aria-label="Cerrar menú"
            >
              {sidebarOpen ? '✖' : '☰'}
            </button>
          )}
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
            ) : (
              user.displayName ? user.displayName[0].toUpperCase() : 'U'
            )}
          </div>
          <div className="user-info">
            <h6>{user.displayName || 'Usuario'}</h6>
            <small>{user.identificador ? user.identificador : user.email}</small>
          </div>
        </div>
        <nav className="sidebar-nav flex-column">
          <button className="sidebar-link" onClick={() => navigate('/')}> <FiHome className="nav-icon" /> <span>Inicio</span> </button>
          <button className="sidebar-link" onClick={() => navigate('/ventas')}> <FiShoppingBag className="nav-icon" /> <span>Ventas</span> </button>
          <button className="sidebar-link" onClick={() => navigate('/forecast')}> <FiBarChart2 className="nav-icon" /> <span>Forecast</span> </button>
          <button className="sidebar-link" onClick={() => navigate('/clientes')}> <FiUsers className="nav-icon" /> <span>Clientes</span> </button>
          <button className="sidebar-link" onClick={() => navigate('/locations')}> <FiMapPin className="nav-icon" /> <span>Ubicaciones</span> </button>
          <button className="sidebar-link active" onClick={() => navigate('/estadisticas')}>
            <FiBarChart2 className="nav-icon" /> <span>Estadísticas</span>
          </button>
          <button className="sidebar-link" onClick={() => navigate('/metricas-financieras')}>
            <FiTrendingUp className="nav-icon" /> <span>Métricas Financieras</span>
          </button>
          <button className="sidebar-link" onClick={() => navigate('/configuracion')}>
            <FiSettings className="nav-icon" /> <span>Configuración</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link logout-link" onClick={() => { localStorage.removeItem('user'); navigate('/signup'); }}>
            <FiLogOut className="nav-icon" /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(!sidebarOpen)} style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1999 }} />
      )}
      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-navbar">
          <div className="navbar-content">
            <div className="d-flex align-items-center">
              <h4 className="mb-0">Estadísticas y KPIs</h4>
            </div>
            <div className="navbar-user d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                size="sm"
                className="toggle-sidebar-btn me-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
              >
                <FiMenu />
              </Button>
              <span>{user.displayName || user.email}</span>
            </div>
          </div>
        </div>
        <div className="dashboard-content">
          <div className="py-4 px-2">
            <Row className="mb-4">
              <Col md={3}>
                <Card className="shadow-sm border-0 mb-3 text-center">
                  <Card.Body>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <FiDollarSign className="text-primary" size={32} />
                      <div>
                        <div className="text-muted small">Total Ventas</div>
                        <div className="h4 mb-0">{noVentas ? <span className='text-secondary'>Sin ventas</span> : totalVentas}</div>
                      </div>
                    </div>
                    {noVentas && <div className="mt-2 text-muted small">Aún no has registrado ventas.<br/>¡Comienza a vender!</div>}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm border-0 mb-3 text-center">
                  <Card.Body>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <FiTag className="text-success" size={32} />
                      <div>
                        <div className="text-muted small">Total Pronósticos</div>
                        <div className="h4 mb-0">{noPronosticos ? <span className='text-secondary'>Sin pronósticos</span> : totalPronosticos}</div>
                      </div>
                    </div>
                    {noPronosticos && <div className="mt-2 text-muted small">Aún no has registrado pronósticos.<br/>¡Anticipa tus ventas!</div>}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm border-0 mb-3 text-center">
                  <Card.Body>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <FiUsers className="text-info" size={32} />
                      <div>
                        <div className="text-muted small">Clientes Únicos</div>
                        <div className="h4 mb-0">{noClientes ? <span className='text-secondary'>Sin clientes</span> : totalClientes}</div>
                      </div>
                    </div>
                    {noClientes && <div className="mt-2 text-muted small">Aún no tienes clientes registrados.<br/>¡Agrega tu primer cliente!</div>}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm border-0 mb-3 text-center">
                  <Card.Body>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <FiBarChart2 className="text-warning" size={32} />
                      <div>
                        <div className="text-muted small">Ticket Promedio</div>
                        <div className="h4 mb-0">{noVentas ? <span className='text-secondary'>-</span> : `$${ticketPromedio}`}</div>
                      </div>
                    </div>
                    {noVentas && <div className="mt-2 text-muted small">El ticket promedio aparecerá cuando registres ventas.</div>}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            {/* Espacio para gráficos y tablas futuras */}
            <Card className="shadow-sm border-0 mb-4 text-center">
              <Card.Body>
                <h5 className="mb-3">Gráficos y Tablas</h5>
                <div className="text-muted">
                  {noVentas && noPronosticos && noClientes
                    ? <>Aquí podrás ver gráficos de ventas, pronósticos y productos más vendidos.<br/>¡Registra tus primeros datos para ver tus estadísticas!</>
                    : <>Aquí podrás ver gráficos de ventas, pronósticos, productos más vendidos, etc. (Próximamente)</>
                  }
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Estadisticas; 