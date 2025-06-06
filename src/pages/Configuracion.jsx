import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Image } from 'react-bootstrap';
import { FiSettings, FiHome, FiShoppingBag, FiBarChart2, FiUsers, FiMapPin, FiLogOut, FiUser, FiUpload, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { firestoreService } from '../lib/FirestoreService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Configuracion = () => {
  const navigate = useNavigate();
  const userLS = JSON.parse(localStorage.getItem('user')) || {};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState({
    displayName: userLS.displayName || '',
    identificador: userLS.identificador || '',
    photoURL: userLS.photoURL || ''
  });
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const fileInputRef = useRef();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Cargar perfil de usuario desde Firestore al iniciar
  useEffect(() => {
    const cargarPerfilUsuario = async () => {
      if (!userLS.uid) {
        setLoadingProfile(false);
        return;
      }
      
      try {
        setLoadingProfile(true);
        // Obtener perfil actualizado desde Firestore
        const userRef = doc(db, 'usuarios', userLS.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const firestoreData = userSnap.data();
          console.log('Perfil cargado desde Firestore:', firestoreData);
          
          // Actualizar el formulario con datos de Firestore
          setForm({
            displayName: firestoreData.displayName || userLS.displayName || '',
            identificador: firestoreData.identificador || userLS.identificador || '',
            photoURL: firestoreData.photoURL || userLS.photoURL || ''
          });
          
          // Actualizar localStorage con datos de Firestore para que otras páginas lo vean
          const updatedUser = {
            ...userLS,
            displayName: firestoreData.displayName || userLS.displayName || '',
            identificador: firestoreData.identificador || userLS.identificador || '',
            photoURL: firestoreData.photoURL || userLS.photoURL || ''
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error al cargar perfil de usuario:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    cargarPerfilUsuario();
  }, [userLS.uid]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, photoURL: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Primero actualizar en Firestore si tenemos el uid
      if (userLS.uid) {
        const userRef = doc(db, 'usuarios', userLS.uid);
        await setDoc(userRef, {
          displayName: form.displayName,
          identificador: form.identificador,
          photoURL: form.photoURL,
          actualizado: new Date().toISOString()
        }, { merge: true });
      }
      
      // Después actualizar en localStorage
      const updatedUser = {
        ...userLS,
        displayName: form.displayName,
        identificador: form.identificador,
        photoURL: form.photoURL
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAlerta({ tipo: 'success', mensaje: 'Configuración guardada correctamente en Firebase y localmente.' });
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      setAlerta({ tipo: 'danger', mensaje: 'Error al guardar la configuración: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const navegarA = ruta => navigate(ruta);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-container">
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
            {form.photoURL ? (
              <Image src={form.photoURL} roundedCircle width={40} height={40} />
            ) : (
              form.displayName ? form.displayName[0].toUpperCase() : 'U'
            )}
          </div>
          <div className="user-info">
            <h6>{form.displayName || 'Usuario'}</h6>
            <small>{form.identificador ? form.identificador : userLS.email}</small>
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
          <button className="sidebar-link active" onClick={() => navegarA('/configuracion')}> <FiSettings className="nav-icon" /> <span>Configuración</span> </button>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link logout-link" onClick={() => { localStorage.removeItem('user'); navegarA('/signup'); }}>
            <FiLogOut className="nav-icon" /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      {isMobile && sidebarOpen && (
        <div onClick={toggleSidebar} style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1999 }} />
      )}
      <main className="dashboard-main">
        <Container className="py-4">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h4 className="mb-4 d-flex align-items-center"><FiSettings className="me-2 text-primary" /> Configuración de Usuario</h4>
                  {alerta && <Alert variant={alerta.tipo} onClose={() => setAlerta(null)} dismissible>{alerta.mensaje}</Alert>}
                  
                  {loadingProfile ? (
                    <div className="text-center py-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="mt-2">Cargando perfil de usuario...</p>
                    </div>
                  ) : (
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3 text-center">
                        <Form.Label>Foto de Perfil</Form.Label>
                        <div className="mb-2">
                          {form.photoURL ? (
                            <Image src={form.photoURL} roundedCircle width={80} height={80} />
                          ) : (
                            <div className="user-avatar-lg">{form.displayName ? form.displayName[0].toUpperCase() : <FiUser size={40} />}</div>
                          )}
                        </div>
                        <Button variant="outline-primary" onClick={() => fileInputRef.current.click()} className="d-flex align-items-center mx-auto">
                          <FiUpload className="me-2" /> Subir Foto
                        </Button>
                        <Form.Control type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control name="displayName" value={form.displayName} onChange={handleChange} placeholder="Tu nombre" />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Identificador</Form.Label>
                        <Form.Control name="identificador" value={form.identificador} onChange={handleChange} placeholder="Ej: H1/DALLAS1" />
                      </Form.Group>
                      <div className="d-flex justify-content-end">
                        <Button 
                          type="submit" 
                          variant="primary" 
                          className="px-4 py-2 rounded-pill"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <FiCheck className="me-2" /> Guardar Cambios
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default Configuracion; 