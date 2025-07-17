import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge } from 'react-bootstrap';
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
import { customersService } from '../services/customers.ts';
import { useQuickBooksAutoConnect } from '../hooks/useQuickBooksAutoConnect';
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

  // Use QuickBooks auto-connection hook
  const { isConnected: qbConnected, isConnecting: qbConnecting, error: qbError, forceReconnect } = useQuickBooksAutoConnect();

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

  // Auto-import when QuickBooks connects
  useEffect(() => {
    if (qbConnected && locations.length === 0) {
      importFromQuickBooks();
    }
  }, [qbConnected]);

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

    if (!qbConnected) {
      setError('QuickBooks no está conectado. Intentando conectar automáticamente...');
      await forceReconnect();
      return;
    }
    
    setImportingFromQB(true);
    setQbSuccess(false);
    setError(null);
    
    try {
      // Get customers from QuickBooks and convert to locations
      const locationData = await customersService.syncCustomersFromQuickBooks();
      
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
          <button className="sidebar-link active" onClick={() => navegarA('/locations')}> <FiMapPin className="nav-icon" /> <span>Ubicaciones</span> </button>
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
              {qbConnecting && (
                <Badge bg="warning" className="ms-2">
                  <FiRefreshCw className="me-1 spin" />
                  Conectando...
                </Badge>
              )}
              {qbConnected && (
                <Badge bg="success" className="ms-2">
                  <FiCloud className="me-1" />
                  QuickBooks Conectado
                </Badge>
              )}
              {qbError && (
                <Badge bg="danger" className="ms-2">
                  <FiAlertCircle className="me-1" />
                  Error de Conexión
                </Badge>
              )}
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
          <h2 className="dashboard-title mb-4">Ubicaciones de Entrega</h2>
          <Container className="py-4">
            <Row>
              {/* QuickBooks Status Section */}
              <Col lg={12} className="mb-4">
                <Card className={`shadow-sm ${qbConnected ? 'quickbooks-card connected' : 'quickbooks-card disconnected'}`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">
                        <FiCloud className="me-2 text-primary" />
                        Estado de QuickBooks
                      </h5>
                      <div className="d-flex gap-2">
                        <Button
                          variant={qbConnected ? "success" : "secondary"}
                          size="sm"
                          onClick={importFromQuickBooks}
                          disabled={!qbConnected || importingFromQB || qbConnecting}
                        >
                          {qbConnecting ? (
                            <>
                              <FiRefreshCw className="me-2 spin" />
                              Conectando...
                            </>
                          ) : importingFromQB ? (
                            <>
                              <FiRefreshCw className="me-2 spin" />
                              Importando...
                            </>
                          ) : (
                            <>
                              <FiCloud className="me-2" />
                              Importar desde QuickBooks
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setShowImporter(true)}
                        >
                          <FiUpload className="me-2" />
                          Importar CSV
                        </Button>
                      </div>
                    </div>
                    
                    {qbConnecting ? (
                      <p className="text-muted mb-0">
                        <strong>Conectando automáticamente a QuickBooks...</strong> Esto puede tomar unos segundos.
                      </p>
                    ) : qbConnected ? (
                      <p className="text-muted mb-0">
                        <strong>Conectado automáticamente a QuickBooks.</strong> Las ubicaciones se sincronizan automáticamente con los clientes de tu cuenta de QuickBooks.
                      </p>
                    ) : qbError ? (
                      <div>
                        <p className="text-danger mb-2">
                          <strong>Error de conexión:</strong> {qbError}
                        </p>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={forceReconnect}
                          disabled={qbConnecting}
                        >
                          <FiRefreshCw className="me-2" />
                          Reintentar Conexión
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">
                        <strong>Conectando automáticamente a QuickBooks...</strong> La aplicación se conectará automáticamente.
                      </p>
                    )}
                    
                    {qbSuccess && (
                      <Alert variant="success" className="mt-3">
                        <FiCheck className="me-2" />
                        Se importaron {qbLocationsCount} ubicaciones desde QuickBooks exitosamente.
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Error Display */}
              {error && (
                <Col lg={12} className="mb-4">
                  <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    <FiAlertCircle className="me-2" />
                    {error}
                    {error.includes('permission') && (
                      <div className="mt-2">
                        <Button variant="outline-danger" size="sm" onClick={refreshAuth}>
                          Refrescar Autenticación
                        </Button>
                      </div>
                    )}
                  </Alert>
                </Col>
              )}

              {/* Locations Table */}
              <Col lg={12}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">
                        <FiMapPin className="me-2 text-primary" />
                        Lista de Ubicaciones
                        <Badge bg="secondary" className="ms-2">
                          {locations.length} ubicaciones
                        </Badge>
                      </h5>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={exportToExcel}
                        disabled={locations.length === 0}
                      >
                        <FiDownload className="me-2" />
                        Exportar a Excel
                      </Button>
                    </div>

                    {loading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Cargando ubicaciones...</p>
                      </div>
                    ) : locations.length === 0 ? (
                      <div className="text-center py-4">
                        <FiMapPin size={48} className="text-muted mb-3" />
                        <p className="text-muted">No hay ubicaciones registradas.</p>
                        {qbConnected && (
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={importFromQuickBooks}
                            disabled={importingFromQB}
                          >
                            <FiCloud className="me-2" />
                            Importar desde QuickBooks
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Dirección</th>
                              <th>Ciudad</th>
                              <th>Estado</th>
                              <th>Contacto</th>
                              <th>Teléfono</th>
                              <th>Origen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {locations.map((location, index) => (
                              <tr key={index}>
                                <td>
                                  <strong>{location.name}</strong>
                                  {location.qbCustomerId && (
                                    <Badge bg="success" className="ms-2">
                                      QB
                                    </Badge>
                                  )}
                                </td>
                                <td>{location.address}</td>
                                <td>{location.city}</td>
                                <td>{location.state}</td>
                                <td>{location.contactName}</td>
                                <td>{location.contactPhone}</td>
                                <td>
                                  {location.qbCustomerId ? (
                                    <Badge bg="success">QuickBooks</Badge>
                                  ) : (
                                    <Badge bg="info">Manual</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </main>

      {/* Location Importer Modal */}
      <LocationImporter 
        show={showImporter} 
        onHide={() => setShowImporter(false)} 
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default Locations; 