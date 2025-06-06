import React, { useState, useEffect } from 'react';
import { Container, Button, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import { 
  FiHome, 
  FiShoppingBag, 
  FiShoppingCart, 
  FiUsers, 
  FiSettings,
  FiMenu,
  FiLogOut,
  FiBarChart2,
  FiDollarSign,
  FiPackage,
  FiAlertCircle,
  FiCreditCard,
  FiMapPin
} from 'react-icons/fi';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totales, setTotales] = useState({
    ventasTotales: 0,
    comisionesTotales: 0
  });

  useEffect(() => {
    // Cargar totales del localStorage
    const totalesGuardados = JSON.parse(localStorage.getItem('totales')) || {
      ventasTotales: 0,
      comisionesTotales: 0
    };
    setTotales(totalesGuardados);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('user');
      navigate('/signup');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navegarA = (ruta) => {
    navigate(ruta);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">Ventas MVP</h2>
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
          <button className="sidebar-link" onClick={() => navegarA('/')}> <FiHome className="nav-icon" /> <span>Inicio</span> </button>
          <button className="sidebar-link" onClick={() => navegarA('/ventas')}> <FiShoppingBag className="nav-icon" /> <span>Ventas</span> </button>
          <button className="sidebar-link" onClick={() => navegarA('/forecast')}> <FiBarChart2 className="nav-icon" /> <span>Forecast</span> </button>
          <button className="sidebar-link"> <FiUsers className="nav-icon" /> <span>Clientes</span> </button>
          <button className="sidebar-link" onClick={() => navegarA('/locations')}> <FiMapPin className="nav-icon" /> <span>Ubicaciones</span> </button>
          <button className="sidebar-link" onClick={() => navegarA('/estadisticas')}> <FiBarChart2 className="nav-icon" /> <span>Estadísticas</span> </button>
          <button className="sidebar-link" onClick={() => navegarA('/configuracion')}>
            <FiSettings className="nav-icon" /> <span>Configuración</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button className="sidebar-link logout-link" onClick={handleLogout}>
            <FiLogOut className="nav-icon" /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-navbar">
          <div className="navbar-content">
            <div className="d-flex align-items-center">
              <h4 className="mb-0">Dashboard</h4>
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
              <span>{user.displayName || user.email}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <Container fluid>
            <div className="content-header">
              <p className="welcome-message">
                ¡Bienvenido de nuevo, {user.displayName || 'Usuario'}! Esto es lo que está pasando con tu negocio hoy.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="row g-4 mb-4">
              <div className="col-md-3 col-sm-6">
                <div className="summary-card sales-card">
                  <div className="card-icon">
                    <FiDollarSign />
                  </div>
                  <div className="card-info">
                    <h3>${totales.ventasTotales.toFixed(2)}</h3>
                    <p>Ventas Totales</p>
                  </div>
                  <div className="card-stats">
                    <span>Desde el inicio</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="summary-card products-card">
                  <div className="card-icon">
                    <FiPackage />
                  </div>
                  <div className="card-info">
                    <h3>0</h3>
                    <p>Ventas Realizadas</p>
                  </div>
                  <div className="card-stats">
                    <span>0 activas</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="summary-card comision-card">
                  <div className="card-icon">
                    <FiCreditCard />
                  </div>
                  <div className="card-info">
                    <h3>${totales.comisionesTotales.toFixed(2)}</h3>
                    <p>Total Retirable</p>
                  </div>
                  <div className="card-stats">
                    <span>Comisión del 28%</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="summary-card alerts-card">
                  <div className="card-icon">
                    <FiAlertCircle />
                  </div>
                  <div className="card-info">
                    <h3>0</h3>
                    <p>Alertas</p>
                  </div>
                  <div className="card-stats">
                    <span>Sin problemas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="row mb-4">
              <div className="col-lg-8">
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <h2>Actividad Reciente</h2>
                  </div>
                  <div className="panel-body">
                    <div className="activity-empty">
                      <div className="empty-icon">
                        <FiBarChart2 />
                      </div>
                      <h3>Sin Actividad Reciente</h3>
                      <p>Tu actividad comercial reciente aparecerá aquí</p>
                      <Button 
                        variant="primary"
                        onClick={() => navegarA('/ventas')}
                      >
                        Comenzar a Vender
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <h2>Acciones Rápidas</h2>
                  </div>
                  <div className="panel-body">
                    <div className="quick-links">
                      <Button 
                        variant="outline-primary" 
                        className="quick-link-btn"
                        onClick={() => navegarA('/ventas')}
                      >
                        <FiPackage /> <span>Registrar Venta</span>
                      </Button>
                      <Button variant="outline-primary" className="quick-link-btn">
                        <FiShoppingCart /> <span>Ver Pedidos</span>
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        className="quick-link-btn"
                        onClick={() => navegarA('/locations')}
                      >
                        <FiMapPin /> <span>Gestionar Ubicaciones</span>
                      </Button>
                      <Button variant="outline-primary" className="quick-link-btn">
                        <FiUsers /> <span>Gestionar Clientes</span>
                      </Button>
                      <Button variant="outline-primary" className="quick-link-btn">
                        <FiSettings /> <span>Configuración</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 