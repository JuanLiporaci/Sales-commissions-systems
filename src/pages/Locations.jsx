import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { 
  FiMapPin, 
  FiHome, 
  FiShoppingBag, 
  FiShoppingCart,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiLogOut,
  FiPlusCircle,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiRefreshCw,
  FiUpload,
  FiAlertCircle,
  FiCloud,
  FiCheck,
  FiTrendingUp
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth.ts';
import { locationsService } from '../services/locations.js';
import quickBooksService from '../services/quickbooks.js';
import LocationImporter from '../components/LocationImporter.jsx';
import { auth } from '../lib/firebase.ts';
import { exportArrayToExcel } from '../utils/excelExport.js';

const Locations = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [importingFromQB, setImportingFromQB] = useState(false);
  const [qbSuccess, setQbSuccess] = useState(false);
  const [qbLocationsCount, setQbLocationsCount] = useState(0);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Check authentication on load
  useEffect(() => {
    const checkAuth = async () => {
      // If no current user, try to force a recheck
      if (!auth.currentUser) {
        try {
          // Force refresh token if possible
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.getIdToken(true);
          } else {
            console.log('No user is currently signed in');
          }
        } catch (err) {
          console.error('Error refreshing auth token:', err);
        }
      }
    };
    
    checkAuth();
  }, []);

  // Load locations on component mount
  useEffect(() => {
    const cachedLocations = localStorage.getItem('locations');
    if (cachedLocations) {
      setLocations(JSON.parse(cachedLocations));
      setLoading(false);
    } else {
      fetchLocations();
    }
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check authentication first
      if (!auth.currentUser) {
        throw new Error('No se ha autenticado. Por favor inicie sesión nuevamente.');
      }
      
      const data = await locationsService.getAllLocations();
      setLocations(data);
      localStorage.setItem('locations', JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching locations:', err);
      if (err.code === 'permission-denied') {
        setError('Permiso denegado. Verifique que tiene acceso para leer la base de datos.');
      } else if (err.message && err.message.includes('permission')) {
        setError('Error de permisos: No tiene suficientes permisos para esta operación.');
      } else {
        setError(err.message || 'No se pudieron cargar las ubicaciones.');
      }
    } finally {
      setLoading(false);
    }
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

  const navegarA = (ruta) => {
    navigate(ruta);
  };

  const handleImportComplete = () => {
    // Refresh locations after import
    fetchLocations();
    setShowImporter(false);
  };

  const exportToExcel = async () => {
    if (locations.length === 0) return;
    // Definir los encabezados y los datos, incluyendo el identificador del vendedor
    const headers = ['name', 'address', 'city', 'state', 'zipCode', 'contactName', 'contactPhone', 'notes', 'vendedorIdentificador'];
    const data = locations.map(location => headers.map(field => location[field] || ''));
    // Agregar encabezados como primera fila
    data.unshift(headers);
    // Generar archivo Excel
    await exportArrayToExcel(data, `ubicaciones_entrega_${new Date().toISOString().split('T')[0]}.xlsx`, 'Ubicaciones');
  };

  const importFromQuickBooks = async () => {
    // Check authentication
    if (!auth.currentUser) {
      setError('No se ha autenticado. Por favor inicie sesión nuevamente.');
      return;
    }
    
    setImportingFromQB(true);
    setQbSuccess(false);
    setError(null);
    
    try {
      // First authenticate with QuickBooks (in a real app this would redirect to OAuth)
      await quickBooksService.authenticate();
      
      // Then get customers and convert to locations
      const locationData = await quickBooksService.importCustomersAsLocations();
      
      if (!locationData || locationData.length === 0) {
        throw new Error('No se encontraron clientes en QuickBooks para importar.');
      }
      
      // Import locations to Firebase
      await locationsService.importLocationsFromData(locationData);
      
      setQbLocationsCount(locationData?.length || 0);
      setQbSuccess(true);
      
      // Refresh locations
      fetchLocations();
    } catch (err) {
      console.error('Error importing from QuickBooks:', err);
      if (err.code === 'permission-denied') {
        setError('Permiso denegado. Verifique que tiene acceso para escribir en la base de datos.');
      } else if (err.message && err.message.includes('permission')) {
        setError('Error de permisos: No tiene suficientes permisos para esta operación.');
      } else {
        setError(err.message || 'Error al importar desde QuickBooks API');
      }
    } finally {
      setImportingFromQB(false);
    }
  };

  const refreshAuth = async () => {
    try {
      // Sign out and sign back in to refresh the token
      await logout();
      setError('Se ha cerrado la sesión. Por favor inicie sesión nuevamente para obtener nuevos permisos.');
      navigate('/login');
    } catch (err) {
      console.error('Error refreshing auth:', err);
      setError('Error al intentar refrescar la sesión. Intente recargar la página.');
    }
  };

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
          <button className="sidebar-link" onClick={() => navegarA('/clientes')}> <FiUsers className="nav-icon" /> <span>Clientes</span> </button>
          <button className="sidebar-link" onClick={() => navegarA('/locations')}> <FiMapPin className="nav-icon" /> <span>Ubicaciones</span> </button>
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
          <button className="sidebar-link logout-link" onClick={handleLogout}>
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
              <h4 className="mb-0">Ubicaciones de Entrega</h4>
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
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                <FiMapPin className="me-2 text-primary" /> 
                Gestión de Ubicaciones
              </h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  className="d-flex align-items-center"
                  onClick={() => setShowImporter(!showImporter)}
                >
                  <FiUpload className="me-1" /> 
                  {showImporter ? 'Ocultar Importador' : 'Importar CSV'}
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="d-flex align-items-center"
                  onClick={importFromQuickBooks}
                  disabled={importingFromQB}
                >
                  <FiCloud className="me-1" />
                  {importingFromQB ? 'Importando...' : 'QuickBooks'}
                </Button>
                <Button 
                  variant="outline-success" 
                  size="sm"
                  className="d-flex align-items-center"
                  onClick={exportToExcel}
                  disabled={locations.length === 0}
                >
                  <FiDownload className="me-1" /> Exportar Excel
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  className="d-flex align-items-center"
                  onClick={fetchLocations}
                >
                  <FiRefreshCw className="me-1" /> Actualizar
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert 
                variant="danger" 
                className="d-flex align-items-start mb-4"
                onClose={() => setError(null)}
                dismissible
              >
                <div>
                  <div className="d-flex align-items-center">
                    <FiAlertCircle className="me-2" /> {error}
                  </div>
                  {(error.includes('permiso') || error.includes('autenticado')) && (
                    <div className="mt-2 small">
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={refreshAuth} 
                        className="mt-1 d-flex align-items-center"
                      >
                        <FiLogOut className="me-1" /> Renovar sesión
                      </Button>
                    </div>
                  )}
                </div>
              </Alert>
            )}
            
            {qbSuccess && (
              <Alert 
                variant="success" 
                className="d-flex align-items-center mb-4"
                onClose={() => setQbSuccess(false)}
                dismissible
              >
                <FiCheck className="me-2" /> Se importaron {qbLocationsCount} ubicaciones desde QuickBooks correctamente.
              </Alert>
            )}
            
            {showImporter && (
              <Row className="mb-4">
                <Col md={12}>
                  <LocationImporter onImportComplete={handleImportComplete} />
                </Col>
              </Row>
            )}
            
            <Card className="shadow-sm">
              <Card.Header className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Ubicaciones de Entrega</h5>
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="d-flex align-items-center"
                  >
                    <FiPlusCircle className="me-1" /> Agregar Ubicación
                  </Button>
                </div>
              </Card.Header>
              <div className="table-responsive">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" role="status" variant="primary">
                      <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-3 text-muted">Cargando ubicaciones...</p>
                  </div>
                ) : locations.length > 0 ? (
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3">Nombre</th>
                        <th className="py-3">Dirección</th>
                        <th className="py-3">Identificador Vendedor</th>
                        <th className="py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map(location => (
                        <tr key={location.id}>
                          <td className="py-3">{location.name}</td>
                          <td className="py-3">{location.address}</td>
                          <td className="py-3">{location.vendedorIdentificador || '-'}</td>
                          <td className="py-3">
                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="btn-icon"
                                title="Editar"
                              >
                                <FiEdit />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                className="btn-icon"
                                title="Eliminar"
                              >
                                <FiTrash2 />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-5">
                    <div className="activity-empty">
                      <div className="empty-icon">
                        <FiMapPin />
                      </div>
                      <h3>No hay ubicaciones</h3>
                      <p className="text-muted mb-4">
                        Agrega ubicaciones de entrega para tus clientes o importa la información desde un archivo CSV o QuickBooks.
                      </p>
                      <div className="d-flex gap-3 justify-content-center">
                        <Button 
                          variant="primary"
                          onClick={() => setShowImporter(true)}
                        >
                          <FiUpload className="me-2" /> Importar CSV
                        </Button>
                        <Button 
                          variant="outline-primary"
                          onClick={importFromQuickBooks}
                          disabled={importingFromQB}
                        >
                          <FiCloud className="me-2" /> Importar de QuickBooks
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </Container>
        </div>
      </main>
    </div>
  );
};

export default Locations; 