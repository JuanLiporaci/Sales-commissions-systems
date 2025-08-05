import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiHome, FiMenu, FiUsers, FiMapPin, FiSettings, FiShoppingBag, FiDollarSign, FiActivity, FiPieChart, FiLogOut, FiTrendingUp } from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuth } from '../lib/AuthContext';
import { logout } from '../services/auth.ts';
import { Button } from 'react-bootstrap';
import QuickBooksDataDisplay from '../components/QuickBooksDataDisplay';

const Dashboard = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Obtener datos de localStorage y combinarlos con AuthContext
  const userLS = JSON.parse(localStorage.getItem('user')) || {};
  const userData = {
    ...userLS,
    ...authUser,
    displayName: userLS.displayName || (authUser?.displayName || ''),
    photoURL: userLS.photoURL || (authUser?.photoURL || ''),
    identificador: userLS.identificador || (authUser?.identificador || '')
  };

  // Formatear monto para mostrar en moneda
  const formatMonto = (monto) => {
    return window.Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(monto);
  };

  // Solución directa: cargar datos desde localStorage o usar datos de muestra
  useEffect(() => {
    console.log("Iniciando carga de datos simplificada");
    try {
      // Intentar cargar las ventas del localStorage
      const ventasGuardadas = localStorage.getItem('ventas');
      
      if (ventasGuardadas) {
        console.log("Usando ventas desde localStorage");
        const ventasParsed = JSON.parse(ventasGuardadas);
        setVentas(ventasParsed);
      } else {
        console.log("No hay ventas en localStorage, usando datos de muestra");
        // Datos de muestra
        const muestraVentas = generarDatosMuestra();
        setVentas(muestraVentas);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      // En caso de error, usar datos de muestra
      const muestraVentas = generarDatosMuestra();
      setVentas(muestraVentas);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Función para generar datos de muestra
  const generarDatosMuestra = () => {
    console.log("Generando datos de muestra");
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    
    return [
      {
        id: 'muestra1',
        cliente: 'Cliente A (muestra)',
        monto: 1500.00,
        fechaRegistro: hoy,
        productos: [{ nombre: 'Producto de muestra', precio: 1500 }]
      },
      {
        id: 'muestra2',
        cliente: 'Cliente B (muestra)',
        monto: 2500.50,
        fechaRegistro: ayer,
        productos: [{ nombre: 'Producto 2', precio: 2500.50 }]
      },
      {
        id: 'muestra3',
        cliente: 'Cliente C (muestra)',
        monto: 3750.75,
        fechaRegistro: ayer,
        productos: [{ nombre: 'Producto Premium', precio: 3750.75 }]
      }
    ];
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
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Calcular estadísticas de manera segura
  const stats = {
    totalVentas: ventas?.length || 0,
    montoTotal: (ventas || []).reduce((sum, venta) => sum + (parseFloat(venta.monto) || 0), 0),
    ventasHoy: (ventas || []).filter(v => {
      try {
        const fecha = v.fechaRegistro instanceof Date ? v.fechaRegistro : new Date(v.fechaRegistro);
        const hoy = new Date();
        return fecha.getDate() === hoy.getDate() &&
               fecha.getMonth() === hoy.getMonth() &&
               fecha.getFullYear() === hoy.getFullYear();
      } catch (error) {
        console.error('Error procesando fecha:', error, v);
        return false;
      }
    }).length,
    montoRetirable: ((ventas || []).reduce((sum, venta) => sum + (parseFloat(venta.monto) || 0), 0)) * 0.3, // 30% del monto total
    ultimaVenta: (ventas || []).length > 0 ? 
      (ventas[0].fechaRegistro instanceof Date ? 
        format(ventas[0].fechaRegistro, 'dd/MM/yyyy HH:mm') : 
        format(new Date(ventas[0].fechaRegistro), 'dd/MM/yyyy HH:mm')) : 
      'No hay ventas'
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{ width: sidebarOpen ? '80vw' : 0, zIndex: 2000, position: 'fixed', left: 0, top: 0, height: '100vh', background: '#1a237e', transition: 'width 0.3s' }}>
        <div className="sidebar-header" style={{ position: 'relative' }}>
          <h2 className="sidebar-logo">Ventas MVP</h2>
          {typeof window !== 'undefined' && window.innerWidth < 768 && (
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
            className="sidebar-link active" 
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
          <button 
            className="sidebar-link" 
            onClick={() => navegarA('/forecast')}
          >
            <FiBarChart2 className="nav-icon" /> <span>Forecast</span>
          </button>
          <button 
            className="sidebar-link" 
            onClick={() => navegarA('/clientes')}
          >
            <FiUsers className="nav-icon" /> <span>Clientes</span>
          </button>
          <button 
            className="sidebar-link"
            onClick={() => navegarA('/locations')}
          >
            <FiMapPin className="nav-icon" /> <span>Ubicaciones</span>
          </button>
          <button 
            className="sidebar-link" 
            onClick={() => navegarA('/estadisticas')}
          >
            <FiActivity className="nav-icon" /> <span>Estadísticas</span>
          </button>
          <button 
            className="sidebar-link" 
            onClick={() => navegarA(userData.admin ? '/admin/metricas-financieras' : '/metricas-financieras')}
          >
            <FiTrendingUp className="nav-icon" /> <span>Métricas Financieras</span>
          </button>
          <button 
            className="sidebar-link" 
            onClick={() => navegarA('/configuracion')}
          >
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

      {typeof window !== 'undefined' && window.innerWidth < 768 && sidebarOpen && (
        <div onClick={toggleSidebar} style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1999 }} />
      )}

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
              <span>{userData.displayName || userData.email}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Stats */}
          <div className="dashboard-stats">
            <div className="stat-card sales-card">
              <div className="stat-icon">
                <FiShoppingBag />
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Total Ventas</h3>
                <p className="stat-value">{stats.totalVentas}</p>
              </div>
            </div>
            <div className="stat-card products-card">
              <div className="stat-icon">
                <FiBarChart2 />
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Monto Total</h3>
                <p className="stat-value">{formatMonto(stats.montoTotal)}</p>
              </div>
            </div>
            <div className="stat-card orders-card">
              <div className="stat-icon">
                <FiDollarSign />
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Monto Retirable</h3>
                <p className="stat-value">{formatMonto(stats.montoRetirable)}</p>
              </div>
            </div>
            <div className="stat-card comision-card">
              <div className="stat-icon">
                <FiUsers />
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Última Venta</h3>
                <p className="stat-value">{stats.ultimaVenta}</p>
              </div>
            </div>
          </div>

          {/* QuickBooks Data */}
          <div className="dashboard-panel mt-4">
            <div className="panel-header">
              <h3 className="mb-0">Datos de QuickBooks</h3>
            </div>
            <div className="panel-body">
              <QuickBooksDataDisplay />
            </div>
          </div>

          {/* Recent Sales */}
          <div className="dashboard-panel mt-4">
            <div className="panel-header">
              <h3 className="mb-0">Ventas Recientes</h3>
            </div>
            <div className="panel-body">
              <div className="table-responsive">
                <table className="table table-modern">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Productos</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="text-center">Cargando...</td>
                      </tr>
                    ) : ventas.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center">No hay ventas registradas</td>
                      </tr>
                    ) : (
                      ventas.slice(0, 5).map((venta) => (
                        <tr key={venta.id}>
                          <td>{venta.fechaRegistro instanceof Date ? 
                            format(venta.fechaRegistro, 'dd/MM/yyyy HH:mm') : 
                            format(new Date(venta.fechaRegistro), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td>{venta.cliente || 'Sin cliente'}</td>
                          <td>{venta.productos?.length || 0} productos</td>
                          <td className="text-success fw-bold">{formatMonto(venta.monto || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          {/* Datos de QuickBooks */}
          <div className="dashboard-panel mt-4">
            <div className="panel-header">
              <h3 className="mb-0">QuickBooks</h3>
            </div>
            <div className="panel-body">
              <QuickBooksDataDisplay />
            </div>
          </div>

          <div className="dashboard-panel mt-4">
            <div className="panel-header">
              <h3 className="mb-0">Acciones Rápidas</h3>
            </div>
            <div className="panel-body">
              <div className="action-buttons">
                <button className="action-btn" onClick={() => navegarA('/ventas')}>
                  <FiShoppingBag className="action-icon text-primary" />
                  <span>Nueva Venta</span>
                </button>
                <button className="action-btn" onClick={() => navegarA('/forecast')}>
                  <FiBarChart2 className="action-icon text-info" />
                  <span>Forecast</span>
                </button>
                <button className="action-btn" onClick={() => navegarA('/clientes')}>
                  <FiUsers className="action-icon text-success" />
                  <span>Clientes</span>
                </button>
                <button className="action-btn" onClick={() => navegarA('/locations')}>
                  <FiMapPin className="action-icon text-warning" />
                  <span>Ubicaciones</span>
                </button>
                <button className="action-btn" onClick={() => navegarA('/estadisticas')}>
                  <FiActivity className="action-icon text-info" />
                  <span>Estadísticas</span>
                </button>
                <button className="action-btn" onClick={() => navegarA(userData.admin ? '/admin/metricas-financieras' : '/metricas-financieras')}>
                  <FiTrendingUp className="action-icon text-success" />
                  <span>Métricas</span>
                </button>
                <button className="action-btn" onClick={() => navegarA('/configuracion')}>
                  <FiSettings className="action-icon text-secondary" />
                  <span>Configuración</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 