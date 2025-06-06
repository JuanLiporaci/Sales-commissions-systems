import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { 
  FiBarChart2, FiCheck, FiCalendar, FiUser, FiHome, FiPlus, FiUsers, FiSettings, FiMenu, FiLogOut, FiTag, FiTruck, FiMapPin, FiShoppingBag, FiTrendingUp
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { locationsService } from '../services/locations.js';
import { productsService } from '../services/products.js';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc as firestoreDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { getLatLngFromAddress } from '../utils/geocode';
import { forecastsService } from '../services/forecasts.js';
import { salesService } from '../services/sales.ts';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import { crearForecastAmigable } from "../utils/firestoreUtils";

const frecuencias = [
  { label: 'Semanal', value: 'semanal' },
  { label: 'Quincenal', value: 'quincenal' },
  { label: 'Mensual', value: 'mensual' },
  { label: 'Trimestral', value: 'trimestral' },
];

const Forecast = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState(-1);
  const clienteInputRef = useRef(null);
  const [forecast, setForecast] = useState({
    cliente: '',
    productos: '',
    frecuencia: '',
  });
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [pronosticos, setPronosticos] = useState([]);
  const [bonusForecast, setBonusForecast] = useState(0);
  const [porcentajeForecast, setPorcentajeForecast] = useState(0);
  const [productos, setProductos] = useState([]);
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerenciasProductos, setMostrarSugerenciasProductos] = useState(false);
  const [indiceSugerenciaProducto, setIndiceSugerenciaProducto] = useState(-1);
  const [productoInput, setProductoInput] = useState('');
  const productoInputRef = useRef(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [forecastsFirestore, setForecastsFirestore] = useState([]);
  const [ventasFirestore, setVentasFirestore] = useState([]);
  const [tick, setTick] = useState(0);
  
  // Nuevos estados para las métricas
  const [metricas, setMetricas] = useState({
    acierto: 0,
    bonus: 0,
    cumplidos: 0,
    total: 0
  });

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const cachedClientes = localStorage.getItem('clientes');
    if (cachedClientes) {
      setClientes(JSON.parse(cachedClientes));
    } else {
      async function fetchClientesFromLocations() {
        try {
          const locations = await locationsService.getAllLocationsCached();
          const nombres = Array.from(new Set(locations.map(loc => loc.name).filter(Boolean)));
          const clientesArr = nombres.map(nombre => ({ nombre }));
          setClientes(clientesArr);
          localStorage.setItem('clientes', JSON.stringify(clientesArr));
        } catch (err) {
          setClientes([]);
        }
      }
      fetchClientesFromLocations();
    }
    const cachedProductos = localStorage.getItem('productos');
    if (cachedProductos) {
      setProductos(JSON.parse(cachedProductos));
    } else {
      async function fetchProductos() {
        try {
          const prods = await productsService.getAllProducts();
          setProductos(prods);
          localStorage.setItem('productos', JSON.stringify(prods));
        } catch (err) {
          setProductos([]);
        }
      }
      fetchProductos();
    }
  }, []);

  useEffect(() => {
    async function fetchFirestoreData() {
      if (!user?.email) return;
      const [forecasts, ventas] = await Promise.all([
        forecastsService.getAllForecasts(user.email),
        salesService.getSalesByUserEmail(user.email)
      ]);
      setForecastsFirestore(forecasts);
      setVentasFirestore(ventas);
    }
    fetchFirestoreData();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const processForecasts = async () => {
      console.log('Pronósticos en Firestore:', forecastsFirestore);
      console.log('Ventas en Firestore:', ventasFirestore);
      
      // Para cada pronóstico, verificamos si se cumplió
      for (const forecast of forecastsFirestore) {
        // 1. Obtenemos información básica del pronóstico
        const clienteForecasted = (forecast.cliente || '').trim().toLowerCase();
        const fechaPronostico = forecast.fechaRegistro ? new Date(forecast.fechaRegistro) : new Date();
        const periodStart = forecast.periodStart ? new Date(forecast.periodStart) : fechaPronostico;
        const periodEnd = getNextPeriod(periodStart, forecast.frecuencia);
        
        console.log(`Verificando pronóstico para ${forecast.cliente} (${forecast.id}):`);
        console.log(`- Período: ${periodStart.toLocaleDateString()} al ${periodEnd.toLocaleDateString()}`);
        console.log(`- Productos pronosticados:`, forecast.productos);
        
        // 2. Buscamos ventas que cumplan con este pronóstico
        let forecumplido = false;
        
        // Filtramos ventas por cliente y período
        const ventasClientePeriodo = ventasFirestore.filter(venta => {
          const clienteVenta = (venta.cliente || '').trim().toLowerCase();
          const fechaVenta = venta.fechaRegistro ? new Date(venta.fechaRegistro) : 
                            (venta.fecha ? new Date(venta.fecha) : new Date());
          
          // Verificamos si la venta es del mismo cliente y está dentro del período
          const clienteMatch = clienteVenta === clienteForecasted;
          const periodoMatch = fechaVenta >= periodStart && fechaVenta < periodEnd;
          
          if (clienteMatch && periodoMatch) {
            console.log(`✓ Encontrada venta para ${venta.cliente} del ${fechaVenta.toLocaleDateString()}`);
            return true;
          }
          return false;
        });
        
        // Si hay ventas para este cliente en este período, verificamos los productos
        if (ventasClientePeriodo.length > 0) {
          console.log(`- ${ventasClientePeriodo.length} ventas encontradas para este cliente en el período`);
          
          // Simplificamos la verificación: consideramos todos los productos vendidos al cliente en ese período
          let totalProductosVendidos = {};
          
          // Sumamos todos los productos vendidos al cliente en el período
          ventasClientePeriodo.forEach(venta => {
            const productosVenta = venta.productos || [];
            productosVenta.forEach(prod => {
              const idProducto = String(prod.id || '').trim();
              if (idProducto) {
                if (!totalProductosVendidos[idProducto]) {
                  totalProductosVendidos[idProducto] = 0;
                }
                totalProductosVendidos[idProducto] += Number(prod.cantidad || 0);
              }
            });
          });
          
          console.log(`- Total productos vendidos en el período:`, totalProductosVendidos);
          
          // Verificamos si se cumplieron todos los productos pronosticados
          const productosPronosticados = forecast.productos || [];
          const todosCumplidos = productosPronosticados.every(prodPronosticado => {
            const idPronosticado = String(prodPronosticado.id || '').trim();
            const cantidadPronosticada = Number(prodPronosticado.cantidad || 0);
            const cantidadVendida = Number(totalProductosVendidos[idPronosticado] || 0);
            
            const cumplido = cantidadVendida >= cantidadPronosticada;
            console.log(`  - Producto ${prodPronosticado.description}: Pronosticado=${cantidadPronosticada}, Vendido=${cantidadVendida}, Cumplido=${cumplido}`);
            
            return cumplido;
          });
          
          if (todosCumplidos && productosPronosticados.length > 0) {
            forecumplido = true;
            console.log(`✅ ¡PRONÓSTICO CUMPLIDO! para ${forecast.cliente}`);
          }
        } else {
          console.log(`✗ No se encontraron ventas para ${forecast.cliente} en este período`);
        }
        
        // 3. Actualizamos el pronóstico según el resultado
        if (forecumplido) {
          // Si el pronóstico se cumplió: actualizar streak y reiniciar periodo
          const newStreak = (forecast.streak || 0) + 1;
          console.log(`- Actualizando racha a ${newStreak} y reiniciando período`);
          
          try {
            await updateDoc(firestoreDoc(db, 'forecasts', forecast.id), {
              streak: newStreak,
              periodStart: new Date().toISOString(),
              lastChecked: new Date().toISOString()
            });
            
            // Actualizar en el estado local
            setForecastsFirestore(prevForecasts => 
              prevForecasts.map(f => 
                f.id === forecast.id 
                  ? {...f, streak: newStreak, periodStart: new Date().toISOString(), lastChecked: new Date().toISOString()} 
                  : f
              )
            );
            
            console.log(`✅ Racha actualizada en Firestore para pronóstico ${forecast.id}`);
          } catch (error) {
            console.error('Error actualizando racha de pronóstico:', error);
          }
        } else if (new Date() > periodEnd) {
          // Si expiró y no se cumplió: eliminar o reiniciar
          console.log(`- El período expiró sin cumplirse. Reiniciando período.`);
          
          try {
            await updateDoc(firestoreDoc(db, 'forecasts', forecast.id), {
              streak: 0,
              periodStart: new Date().toISOString(),
              lastChecked: new Date().toISOString()
            });
            
            // Actualizar en el estado local
            setForecastsFirestore(prevForecasts => 
              prevForecasts.map(f => 
                f.id === forecast.id 
                  ? {...f, streak: 0, periodStart: new Date().toISOString(), lastChecked: new Date().toISOString()} 
                  : f
              )
            );
            
            console.log(`⚠️ Pronóstico reiniciado para ${forecast.cliente}`);
          } catch (error) {
            console.error('Error reiniciando pronóstico:', error);
          }
        } else {
          // Si todavía está en período y no se ha cumplido: actualizar lastChecked
          console.log(`- Pronóstico aún no cumplido pero en período activo`);
          
          try {
            await updateDoc(firestoreDoc(db, 'forecasts', forecast.id), {
              lastChecked: new Date().toISOString()
            });
            
            console.log(`📝 Actualizada fecha de última verificación para pronóstico ${forecast.id}`);
          } catch (error) {
            console.error('Error actualizando fecha de última verificación:', error);
          }
        }
        
        console.log('--------------------------------------------------');
      }
      
      // Actualizar la interfaz con el estado de los pronósticos
      const resultados = calcularAciertoYBonus();
      setPorcentajeForecast(resultados.acierto);
      setBonusForecast(resultados.bonus);
    };
    
    if (forecastsFirestore.length && ventasFirestore.length) {
      processForecasts();
    }
    // eslint-disable-next-line
  }, [forecastsFirestore, ventasFirestore, tick]);

  const handleClienteInputChange = (e) => {
    const value = e.target.value;
    setForecast({ ...forecast, cliente: value });
    if (value.length > 0) {
      const coincidencias = clientes.filter(c => c.nombre && c.nombre.toLowerCase().includes(value.toLowerCase()));
      setSugerencias(coincidencias);
      setMostrarSugerencias(true);
      setIndiceSugerencia(-1);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
    }
  };

  const handleSeleccionarSugerencia = (nombre) => {
    setForecast({ ...forecast, cliente: nombre });
    setSugerencias([]);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);
  };

  const handleClienteKeyDown = (e) => {
    if (!mostrarSugerencias || sugerencias.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSugerencia(prev => Math.min(prev + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSugerencia(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (indiceSugerencia >= 0 && indiceSugerencia < sugerencias.length) {
        e.preventDefault();
        handleSeleccionarSugerencia(sugerencias[indiceSugerencia].nombre);
      }
    } else if (e.key === 'Escape') {
      setMostrarSugerencias(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForecast({ ...forecast, [name]: value });
  };

  const registrarForecast = async () => {
    console.log("[DEBUG] crearForecastAmigable:", typeof crearForecastAmigable);
    if (!forecast.cliente || productosSeleccionados.length === 0 || !forecast.frecuencia) {
      alert('Por favor complete todos los campos');
      return;
    }
    // Buscar la dirección del cliente en locations
    let direccionCliente = '';
    try {
      const locations = await locationsService.getAllLocationsCached();
      const clienteLoc = locations.find(loc => loc.name && loc.name.toLowerCase() === forecast.cliente.toLowerCase());
      if (clienteLoc && clienteLoc.address) {
        direccionCliente = clienteLoc.address;
        let coords = clienteLoc.lat && clienteLoc.lng ? { lat: clienteLoc.lat, lng: clienteLoc.lng } : null;
        if (!coords) {
          coords = await getLatLngFromAddress(direccionCliente);
          if (coords && clienteLoc.id) {
            await locationsService.updateLocation(clienteLoc.id, { lat: coords.lat, lng: coords.lng });
          }
        }
      }
    } catch (err) {
      console.error('Error buscando dirección o geocodificando:', err);
    }

    // Verificar si ya existe un forecast igual
    const forecastExistente = forecastsFirestore.find(f =>
      f.cliente === forecast.cliente &&
      f.frecuencia === forecast.frecuencia &&
      f.productos && productosSeleccionados &&
      f.productos.length === productosSeleccionados.length &&
      f.productos.every(pF => productosSeleccionados.some(pS => (pF.id || pF.code) === (pS.id || pS.code) && Number(pF.cantidad) === Number(pS.cantidad)))
    );
    if (forecastExistente) {
      alert('Ya existe un pronóstico igual para este cliente, productos y frecuencia.');
      return;
    }

    const nuevoPronostico = {
      ...forecast,
      productos: productosSeleccionados,
      fechaRegistro: new Date().toISOString(),
      cumplido: false,
      usuarioEmail: user.email || '',
      direccionCliente,
      streak: 0
    };
    try {
      const nuevoId = await crearForecastAmigable(nuevoPronostico);
      const forecastFinal = { ...nuevoPronostico, id: nuevoId };
      setForecastsFirestore(prev => [forecastFinal, ...prev]);
      setMostrarAlerta(true);
      setTimeout(() => setMostrarAlerta(false), 3000);
      setForecast({ cliente: '', productos: '', frecuencia: '' });
      setProductosSeleccionados([]);
      setProductoInput('');
      setSugerencias([]);
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
    } catch (err) {
      console.error('Error guardando forecast en Firestore:', err);
      alert('Error guardando forecast en Firestore: ' + err.message);
    }
  };

  const cumplirForecast = (id) => {
    setPronosticos(pronosticos.map(f => f.id === id ? { ...f, cumplido: true } : f));
    setBonusForecast(1);
    setPorcentajeForecast(100);
  };

  const navegarA = (ruta) => {
    navigate(ruta);
  };

  const handleProductoInputChange = (e) => {
    const value = e.target.value;
    setProductoInput(value);
    if (value.length > 0) {
      const coincidencias = productos.filter(p => p.description && p.description.toLowerCase().includes(value.toLowerCase()));
      setSugerenciasProductos(coincidencias);
      setMostrarSugerenciasProductos(true);
      setIndiceSugerenciaProducto(-1);
    } else {
      setSugerenciasProductos([]);
      setMostrarSugerenciasProductos(false);
      setIndiceSugerenciaProducto(-1);
    }
  };

  const handleSeleccionarProducto = (producto) => {
    if (productosSeleccionados.some(p => p.id === producto.id)) return;
    setProductosSeleccionados([...productosSeleccionados, { ...producto, cantidad: 1 }]);
    setProductoInput('');
    setSugerenciasProductos([]);
    setMostrarSugerenciasProductos(false);
    setIndiceSugerenciaProducto(-1);
    if (productoInputRef.current) productoInputRef.current.focus();
  };

  const handleProductoKeyDown = (e) => {
    if (!mostrarSugerenciasProductos || sugerenciasProductos.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSugerenciaProducto(prev => Math.min(prev + 1, sugerenciasProductos.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSugerenciaProducto(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (indiceSugerenciaProducto >= 0 && indiceSugerenciaProducto < sugerenciasProductos.length) {
        e.preventDefault();
        handleSeleccionarProducto(sugerenciasProductos[indiceSugerenciaProducto]);
      }
    } else if (e.key === 'Escape') {
      setMostrarSugerenciasProductos(false);
    }
  };

  const handleCantidadChange = (id, cantidad) => {
    setProductosSeleccionados(productosSeleccionados.map(p => p.id === id ? { ...p, cantidad } : p));
  };

  const handleEliminarProducto = (id) => {
    setProductosSeleccionados(productosSeleccionados.filter(p => p.id !== id));
  };

  // Cálculo de % de acierto y bonus
  const calcularAciertoYBonus = () => {
    if (!forecastsFirestore.length) return { acierto: 0, bonus: 0, cumplidos: 0, total: 0 };
    
    // Contamos pronósticos con racha >= 1 como cumplidos
    const cumplidos = forecastsFirestore.filter(f => (f.streak || 0) >= 1).length;
    const total = forecastsFirestore.length;
    
    // Calculamos el porcentaje de acierto
    const acierto = total > 0 ? Math.round((cumplidos / total) * 100) : 0;
    
    // Otorgamos bonus si el acierto es >= 80%
    const bonus = acierto >= 80 ? 1 : 0;
    
    console.log(`Cálculo de acierto: ${cumplidos}/${total} = ${acierto}% - Bonus: ${bonus}`);
    
    // Actualizar estado con los resultados
    setMetricas({ acierto, bonus, cumplidos, total });
    
    return { acierto, bonus, cumplidos, total };
  };

  const getNextPeriod = (start, frecuencia) => {
    const date = new Date(start);
    switch (frecuencia) {
      case 'semanal':
        date.setDate(date.getDate() + 7);
        break;
      case 'quincenal':
        date.setDate(date.getDate() + 15);
        break;
      case 'mensual':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'trimestral':
        date.setMonth(date.getMonth() + 3);
        break;
      default:
        date.setDate(date.getDate() + 7);
    }
    return date;
  };

  const getStreakEmoji = (streak) => {
    if (streak >= 5) return '🚀';
    if (streak >= 2) return '🔥';
    return '';
  };

  const getBgColor = (percent) => {
    if (percent > 0.5) return 'bg-green-100';
    if (percent > 0.25) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getTimeLeft = (end) => {
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return { expired: true, text: 'Expirado', percent: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return {
      expired: false,
      text: `${days}d ${hours}h ${minutes}m`,
      percent: diff / differenceInMilliseconds(end, end - (end - new Date())) // percent left in this period
    };
  };

  // Filtrar solo pronósticos activos y calcular datos visuales
  const pronosticosActivos = forecastsFirestore.filter(forecast => {
    const periodStart = forecast.periodStart ? new Date(forecast.periodStart) : new Date(forecast.fechaRegistro);
    const periodEnd = getNextPeriod(periodStart, forecast.frecuencia);
    return new Date() < periodEnd;
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
          <button className="sidebar-link active" onClick={() => navegarA('/forecast')}> <FiBarChart2 className="nav-icon" /> <span>Forecast</span> </button>
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
      </aside>
      {isMobile && sidebarOpen && (
        <div onClick={toggleSidebar} style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1999 }} />
      )}
      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-navbar">
          <div className="navbar-content">
            <div className="d-flex align-items-center">
              <h4 className="mb-0">Pronóstico de Pedidos (Forecast)</h4>
            </div>
            <div className="navbar-user d-flex align-items-center">
              <Button variant="outline-secondary" size="sm" className="toggle-sidebar-btn me-2" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}>
                <FiMenu />
              </Button>
              <span>{user.displayName || user.email}</span>
            </div>
          </div>
        </div>
        <Container fluid className="py-4">
          {mostrarAlerta && (
            <Alert variant="success" className="shadow-sm border-0 mb-4" onClose={() => setMostrarAlerta(false)} dismissible>
              <Alert.Heading className="d-flex align-items-center">
                <FiCheck className="me-2" /> ¡Pronóstico registrado con éxito!
              </Alert.Heading>
              <p className="mb-0">
                El pronóstico ha sido registrado correctamente.<br />
                ¡Recuerda que si aciertas, tu comisión sube <strong>+1%</strong>!
              </p>
            </Alert>
          )}
          <Row className="justify-content-center">
            <Col xs={12} md={10} lg={8} xl={8} className="mx-auto">
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <h5 className="mb-4">Nuevo Pronóstico</h5>
                  <Form>
                    <Row>
                      <Col md={6} className="mb-3">
                        <div className="input-group mb-2 shadow-sm position-relative">
                          <Form.Control
                            type="text"
                            id="cliente"
                            name="cliente"
                            value={forecast.cliente}
                            onChange={handleClienteInputChange}
                            onKeyDown={handleClienteKeyDown}
                            placeholder="Nombre del cliente"
                            className="bg-light form-control-sm"
                            autoComplete="off"
                            ref={clienteInputRef}
                          />
                          <span className="input-group-text bg-light">
                            <FiUser className="text-primary me-1" /> Cliente
                          </span>
                          {/* Sugerencias de autocomplete */}
                          {mostrarSugerencias && sugerencias.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 10,
                              background: '#fff',
                              border: '1px solid #e0e0e0',
                              borderTop: 'none',
                              maxHeight: 180,
                              overflowY: 'auto',
                              borderRadius: '0 0 12px 12px',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            }}>
                              {sugerencias.map((c, idx) => (
                                <div
                                  key={c.id || c.nombre || idx}
                                  style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    background: idx === indiceSugerencia ? '#f0f4ff' : 'transparent',
                                    color: idx === indiceSugerencia ? '#1a237e' : '#222',
                                    fontWeight: idx === indiceSugerencia ? 600 : 400,
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseDown={() => handleSeleccionarSugerencia(c.nombre)}
                                  onMouseEnter={() => setIndiceSugerencia(idx)}
                                >
                                  {c.nombre}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={12} className="mb-3">
                        <div className="input-group mb-2 shadow-sm position-relative">
                          <Form.Control
                            type="text"
                            placeholder="Buscar producto..."
                            value={productoInput}
                            onChange={handleProductoInputChange}
                            onKeyDown={handleProductoKeyDown}
                            className="bg-light form-control-sm"
                            autoComplete="off"
                            ref={productoInputRef}
                          />
                          <span className="input-group-text bg-light">
                            <FiTag className="text-primary me-1" /> Productos
                          </span>
                          {mostrarSugerenciasProductos && sugerenciasProductos.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 10,
                              background: '#fff',
                              border: '1px solid #e0e0e0',
                              borderTop: 'none',
                              maxHeight: 180,
                              overflowY: 'auto',
                              borderRadius: '0 0 12px 12px',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            }}>
                              {sugerenciasProductos.map((p, idx) => (
                                <div
                                  key={p.id}
                                  style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    background: idx === indiceSugerenciaProducto ? '#f0f4ff' : 'transparent',
                                    color: idx === indiceSugerenciaProducto ? '#1a237e' : '#222',
                                    fontWeight: idx === indiceSugerenciaProducto ? 600 : 400,
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseDown={() => handleSeleccionarProducto(p)}
                                  onMouseEnter={() => setIndiceSugerenciaProducto(idx)}
                                >
                                  {p.description}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Lista de productos seleccionados */}
                        {productosSeleccionados.length > 0 && (
                          <div className="mt-2">
                            {productosSeleccionados.map((p) => (
                              <div key={p.id} className="d-flex align-items-center mb-2" style={{gap: 8}}>
                                <span style={{flex: 1}}>{p.description}</span>
                                <Form.Control
                                  type="number"
                                  min={1}
                                  value={p.cantidad}
                                  onChange={e => handleCantidadChange(p.id, Number(e.target.value))}
                                  style={{width: 70, marginRight: 8}}
                                  className="form-control-sm"
                                />
                                <Button variant="outline-danger" size="sm" onClick={() => handleEliminarProducto(p.id)}>
                                  Quitar
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="input-group mb-2 shadow-sm">
                          <Form.Select
                            id="frecuencia"
                            name="frecuencia"
                            value={forecast.frecuencia}
                            onChange={handleInputChange}
                            className="bg-light form-control-sm custom-select"
                          >
                            <option value="">Selecciona frecuencia</option>
                            {frecuencias.map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </Form.Select>
                          <span className="input-group-text bg-light">
                            <FiCalendar className="text-primary me-1" /> Frecuencia
                          </span>
                        </div>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-3">
                      <Button 
                        variant="primary"
                        className="px-4 py-2 register-btn rounded-pill"
                        onClick={registrarForecast}
                        disabled={!forecast.cliente || !forecast.frecuencia}
                      >
                        <FiCheck className="me-2" /> Registrar Pronóstico
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
              <Card className="shadow-sm mb-4 border border-gray-200">
                <Card.Body>
                  <h5 className="mb-3 font-semibold flex items-center gap-2">
                    <FiBarChart2 className="text-primary" /> Pronósticos Activos
                  </h5>
                  <div className="overflow-auto rounded-lg" style={{ maxHeight: 350 }}>
                    <table className="min-w-full text-sm bg-white rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-gray-700">Cliente</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-700">Productos</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-700">Frecuencia</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-700">Racha</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-700">Tiempo restante</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pronosticosActivos.map(forecast => {
                          const periodStart = forecast.periodStart ? new Date(forecast.periodStart) : new Date(forecast.fechaRegistro);
                          const periodEnd = getNextPeriod(periodStart, forecast.frecuencia);
                          const totalPeriod = periodEnd - periodStart;
                          const timeLeft = periodEnd - new Date();
                          const percent = timeLeft / totalPeriod;
                          const bgColor = getBgColor(percent);
                          const streak = forecast.streak || 0;
                          const emoji = getStreakEmoji(streak);
                          const { text } = getTimeLeft(periodEnd);
                          return (
                            <tr key={forecast.id} className={`${bgColor} transition-all border-b last:border-b-0`}>
                              <td className="px-3 py-2 font-semibold align-middle">{forecast.cliente}</td>
                              <td className="px-3 py-2 align-middle">{(forecast.productos || []).map(p => p.description).join(', ')}</td>
                              <td className="px-3 py-2 align-middle">{forecast.frecuencia}</td>
                              <td className="px-3 py-2 font-bold align-middle">{streak} {emoji}</td>
                              <td className="px-3 py-2 align-middle">{text}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {pronosticosActivos.length === 0 && <div className="text-center text-gray-400 py-4">No hay pronósticos activos</div>}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default Forecast; 