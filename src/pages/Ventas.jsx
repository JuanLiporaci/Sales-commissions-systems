import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Alert } from 'react-bootstrap';
import { 
  FiShoppingBag, 
  FiDollarSign, 
  FiCheck, 
  FiCalendar, 
  FiUser, 
  FiFileText, 
  FiHome, 
  FiPlus,
  FiCreditCard,
  FiShoppingCart,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiLogOut,
  FiTag,
  FiTruck,
  FiMapPin,
  FiTrendingUp,
  FiEdit2
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth.ts';
import { locationsService } from '../services/locations.js';
import { getLatLngFromAddress } from '../utils/geocode';
import { productsService } from '../services/products.js';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { forecastsService } from '../services/forecasts.js';
import { salesService } from '../services/sales.ts';
import { crearVentaAmigable } from "../utils/firestoreUtils";
import googleSheetsService from '../services/googleSheets.js';

const Ventas = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [nuevaVenta, setNuevaVenta] = useState({
    concepto: '',
    monto: '',
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    metodoPago: 'Efectivo',
    tipoPago: 'Contado',
    notas: ''
  });
  const [comisionCalculada, setComisionCalculada] = useState(0);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [totalesGenerales, setTotalesGenerales] = useState({
    ventasTotales: 0,
    comisionesTotales: 0
  });
  const [clientes, setClientes] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState(-1);
  const clienteInputRef = useRef(null);
  const [cumpleBonusTresMillas, setCumpleBonusTresMillas] = useState(false);
  const [productos, setProductos] = useState([]);
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarSugerenciasProductos, setMostrarSugerenciasProductos] = useState(false);
  const [indiceSugerenciaProducto, setIndiceSugerenciaProducto] = useState(-1);
  const [productoInput, setProductoInput] = useState('');
  const productoInputRef = useRef(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [feeVenta, setFeeVenta] = useState("");
  const [errorValidacion, setErrorValidacion] = useState("");
  const [direccionCliente, setDireccionCliente] = useState("");
  const [editandoDireccion, setEditandoDireccion] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [idClienteSeleccionado, setIdClienteSeleccionado] = useState(null);
  const [guardandoDireccion, setGuardandoDireccion] = useState(false);
  const [errorDireccion, setErrorDireccion] = useState("");
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [bonusOn] = useState(() => {
    const saved = localStorage.getItem('bonusOn');
    return saved === null ? false : saved === 'true';
  });
  
  // Estado para multipago
  const [multipago, setMultipago] = useState([
    { metodo: 'Efectivo', monto: '' }
  ]);
  
  // Estado para filtros en historial
  const [filtroClienteHistorial, setFiltroClienteHistorial] = useState('');
  const [filtroFechaHistorial, setFiltroFechaHistorial] = useState('');
  const [filtroMetodoPagoHistorial, setFiltroMetodoPagoHistorial] = useState('');
  const [filtroTipoPagoHistorial, setFiltroTipoPagoHistorial] = useState('');
  
  // Estado para modal de método de pago al marcar como pagada
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [ventaParaPagar, setVentaParaPagar] = useState(null);
  const [metodoPagoReal, setMetodoPagoReal] = useState('Efectivo');
  const [multipagoReal, setMultipagoReal] = useState([{ metodo: 'Efectivo', monto: '' }]);

  // Estado para modal de edición de ventas
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [ventaParaEditar, setVentaParaEditar] = useState(null);
  const [ventaEditada, setVentaEditada] = useState({
    concepto: '',
    cliente: '',
    fecha: '',
    metodoPago: 'Efectivo',
    tipoPago: 'Contado',
    notas: '',
    productos: []
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Nueva función: cargar ventas desde Firestore por usuario
  const cargarVentasFirestore = async (usuarioEmail) => {
    try {
      const ventasRef = collection(db, 'ventas');
      const q = query(
        ventasRef,
        where('usuarioEmail', '==', usuarioEmail),
        orderBy('fechaRegistro', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ventasFirestore = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      return ventasFirestore;
    } catch (err) {
      console.error('Error cargando ventas de Firestore:', err);
      return [];
    }
  };

  // useEffect para cargar ventas: primero localStorage, luego Firestore
  useEffect(() => {
    const ventasGuardadas = JSON.parse(localStorage.getItem('ventas')) || [];
    setVentas(ventasGuardadas);
    // Luego sincronizar con Firestore
    async function syncVentas() {
      console.log('[Ventas] Usuario cargado para sincronizar ventas:', user);
      if (!user.email) {
        console.log('[Ventas] No hay user.email, no se consulta Firestore');
        return;
      }
      const ventasFirestore = await cargarVentasFirestore(user.email);
      console.log('[Ventas] Ventas traídas de Firestore:', ventasFirestore);
      setVentas(ventasFirestore);
      localStorage.setItem('ventas', JSON.stringify(ventasFirestore));
      // Actualizar totales también
      const ventasTotales = ventasFirestore.reduce((sum, v) => sum + (parseFloat(v.monto) || 0), 0);
      const comisionesTotales = ventasFirestore.reduce((sum, v) => sum + (parseFloat(v.comision) || 0), 0);
      setTotalesGenerales({ ventasTotales, comisionesTotales });
      localStorage.setItem('totales', JSON.stringify({ ventasTotales, comisionesTotales }));
    }
    syncVentas();
    // eslint-disable-next-line
  }, [user.email]);

  // Guardar ventas en localStorage cuando cambian (por si se agregan manualmente)
  useEffect(() => {
    localStorage.setItem('ventas', JSON.stringify(ventas));
  }, [ventas]);

  // Leer clientes desde la base de datos de ubicaciones al cargar
  useEffect(() => {
    async function fetchClientesFromLocations() {
      try {
        const locations = await locationsService.getAllLocations(false);
        const nombres = Array.from(new Set(locations.map(loc => loc.name).filter(Boolean)));
        const clientesArr = nombres.map(nombre => ({ nombre }));
        setClientes(clientesArr);
        localStorage.setItem('clientes', JSON.stringify(clientesArr));
      } catch (err) {
        setClientes([]);
      }
    }
    const cachedClientes = localStorage.getItem('clientes');
    if (cachedClientes) {
      setClientes(JSON.parse(cachedClientes));
    } else {
      fetchClientesFromLocations();
    }
  }, []);

  // Leer productos desde la base de datos de productos al cargar
  useEffect(() => {
    localStorage.removeItem('productos'); // <-- Fuerza recarga limpia
    async function fetchProductos() {
      try {
        const prods = await productsService.getAllProducts();
        setProductos(prods);
        localStorage.setItem('productos', JSON.stringify(prods));
        console.log('DEBUG productos firestore:', prods);
      } catch (err) {
        setProductos([]);
      }
    }
    fetchProductos();
  }, []);

  // Calcular bonus de 3 millas cada vez que cambian las ventas
  async function calcularBonusTresMillas(ventasParam = null) {
    try {
      const locations = await locationsService.getAllLocations(false);
      // Obtener clientes únicos de las ventas
      const ventasUsar = ventasParam || ventas;
      const clientesUnicos = Array.from(new Set(ventasUsar.map(v => v.cliente)));
      console.log('[3 millas] Clientes únicos:', clientesUnicos);
      // Obtener coordenadas de cada cliente
      const coordsClientes = [];
      for (const nombre of clientesUnicos) {
        const loc = locations.find(l => l.name && l.name.toLowerCase() === nombre.toLowerCase());
        if (loc && loc.address) {
          let coords = loc.lat && loc.lng ? { lat: Number(loc.lat), lng: Number(loc.lng) } : null;
          if (!coords) {
            coords = await getLatLngFromAddress(loc.address);
          }
          if (coords) {
            coordsClientes.push(coords);
            console.log(`[3 millas] Coordenadas de ${nombre}:`, coords);
          } else {
            console.log(`[3 millas] No se encontraron coordenadas para ${nombre}`);
          }
        }
      }
      if (coordsClientes.length < 2) {
        setCumpleBonusTresMillas(false);
        console.log('[3 millas] No hay suficientes clientes con coordenadas para probar el bonus.');
        return;
      }
      // Calcular centroide
      const avgLat = coordsClientes.reduce((sum, c) => sum + c.lat, 0) / coordsClientes.length;
      const avgLng = coordsClientes.reduce((sum, c) => sum + c.lng, 0) / coordsClientes.length;
      // Calcular distancia máxima desde el centroide
      const distancias = coordsClientes.map(c => haversineDistance(avgLat, avgLng, c.lat, c.lng));
      // Print de distancias entre cada par de clientes
      if (coordsClientes.length >= 2) {
        for (let i = 0; i < coordsClientes.length; i++) {
          for (let j = i + 1; j < coordsClientes.length; j++) {
            const d = haversineDistance(coordsClientes[i].lat, coordsClientes[i].lng, coordsClientes[j].lat, coordsClientes[j].lng);
            console.log(`[3 millas] Distancia entre cliente ${i + 1} y cliente ${j + 1}:`, d.toFixed(6), 'millas');
          }
        }
      }
      const maxDist = Math.max(...distancias);
      console.log('[3 millas] Centroide:', { lat: avgLat, lng: avgLng });
      console.log('[3 millas] Distancias de cada cliente al centroide (millas):', distancias.map(d => d.toFixed(3)));
      console.log('[3 millas] Distancia máxima:', maxDist.toFixed(3), 'millas');
      if (maxDist <= 3) {
        setCumpleBonusTresMillas(true);
        console.log('[3 millas] ✅ ¡BONUS DE 3 MILLAS CUMPLIDO!');
      } else {
        setCumpleBonusTresMillas(false);
        console.log('[3 millas] ❌ No se cumple el bonus de 3 millas.');
      }
    } catch (err) {
      setCumpleBonusTresMillas(false);
      console.log('[3 millas] Error en el cálculo:', err);
    }
  }

  useEffect(() => {
    calcularBonusTresMillas();
    // eslint-disable-next-line
  }, [ventas]);

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

  // Calcular porcentaje de ventas en efectivo
  const ventasEfectivo = ventas.filter(v => (v.metodoPago || '').toLowerCase() === 'efectivo');
  const porcentajeEfectivo = ventas.length > 0 ? (ventasEfectivo.length / ventas.length) * 100 : 0;
  const cumpleBonusEfectivo = porcentajeEfectivo >= 80;

  // Calcular porcentaje de ventas de contado
  const ventasContado = ventas.filter(v => (v.tipoPago || '').toLowerCase() === 'contado');
  const porcentajeContado = ventas.length > 0 ? (ventasContado.length / ventas.length) * 100 : 0;
  const cumpleBonusContado = porcentajeContado >= 80;

  // Cambia la comisión base a 20%
  const comisionBase = 0.20;
  const bonusEfectivo = bonusOn ? (cumpleBonusEfectivo ? 0.01 : 0) : 0;
  const bonusContado = bonusOn ? (cumpleBonusContado ? 0.01 : 0) : 0;
  const bonusTresMillas = bonusOn ? (cumpleBonusTresMillas ? 0.01 : 0) : 0;
  const bonusForecastRaw = bonusOn ? Number(localStorage.getItem('bonusForecast') || 0) : 0;
  const comisionRate = comisionBase + bonusEfectivo + bonusContado + bonusTresMillas + bonusForecastRaw * 0.01;

  // Función para obtener el costo correcto según el usuario
  function obtenerCostoProducto(producto, usuario) {
    if (usuario.jesus && producto.costo_jesus) {
      return producto.costo_jesus;
    }
    return producto.costo_falcon;
  }

  // Calcular profit y comisión por producto
  const productosConProfit = productosSeleccionados.map(p => {
    const costo = obtenerCostoProducto(p, user) ?? 0;
    const precioVenta = p.precioVenta === '' ? 0 : parseFloat(p.precioVenta);
    const cantidad = parseFloat(p.cantidad ?? 1) || 1;
    const profit = (precioVenta - costo) * cantidad;
    const comisionProducto = profit > 0 ? profit * comisionRate : 0;
    return {
      ...p,
      costo,
      profit: isNaN(profit) ? 0 : profit,
      precioVenta: p.precioVenta,
      cantidad,
      comisionProducto: isNaN(comisionProducto) ? 0 : comisionProducto
    };
  });
  // Comisión total: suma de comisiones individuales
  const comisionTotal = productosConProfit.reduce((sum, p) => sum + (p.comisionProducto || 0), 0);

  // useEffect para calcular comisión automáticamente
  useEffect(() => {
    setComisionCalculada(productosSeleccionados.length > 0 ? comisionTotal : 0);
  }, [productosSeleccionados, feeVenta, comisionRate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaVenta({
      ...nuevaVenta,
      [name]: value
    });

    // Resetear multipago cuando se cambie el método de pago
    if (name === 'metodoPago' && value !== 'Multipago') {
      resetearMultipago();
    }

    // Calcular comisión en tiempo real cuando cambia el monto
    if (name === 'monto') {
      const montoNumerico = parseFloat(value) || 0;
      setComisionCalculada(calcularComision(montoNumerico));
    }
  };

  const handleClienteInputChange = (e) => {
    const value = e.target.value;
    setNuevaVenta({
      ...nuevaVenta,
      cliente: value
    });
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
    setNuevaVenta({
      ...nuevaVenta,
      cliente: nombre
    });
    setSugerencias([]);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);
  };

  // Manejar navegación con teclado en el autocomplete
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

  // Autocompletado de productos
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
    setProductosSeleccionados([
      ...productosSeleccionados,
      {
        ...producto,
        cantidad: 1,
        precioVenta: '',
        costo_falcon: Number(producto.costo_falcon) || 0,
        costo_jesus: Number(producto.costo_jesus) || 0
      }
    ]);
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

  // Funciones para multipago
  const agregarMetodoPago = () => {
    setMultipago([...multipago, { metodo: 'Efectivo', monto: '' }]);
  };

  const eliminarMetodoPago = (index) => {
    if (multipago.length > 1) {
      setMultipago(multipago.filter((_, i) => i !== index));
    }
  };

  const actualizarMetodoPago = (index, campo, valor) => {
    const nuevosMetodos = [...multipago];
    nuevosMetodos[index][campo] = valor;
    setMultipago(nuevosMetodos);
  };

  const resetearMultipago = () => {
    setMultipago([{ metodo: 'Efectivo', monto: '' }]);
  };

  // Funciones para multipago real (al marcar como pagada)
  const agregarMetodoPagoReal = () => {
    setMultipagoReal([...multipagoReal, { metodo: 'Efectivo', monto: '' }]);
  };

  const eliminarMetodoPagoReal = (index) => {
    if (multipagoReal.length > 1) {
      setMultipagoReal(multipagoReal.filter((_, i) => i !== index));
    }
  };

  const actualizarMetodoPagoReal = (index, campo, valor) => {
    const nuevosMetodos = [...multipagoReal];
    nuevosMetodos[index][campo] = valor;
    setMultipagoReal(nuevosMetodos);
  };

  // Haversine formula para calcular distancia en millas
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;
    const R = 3958.8; // Radio de la Tierra en millas
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const registrarVenta = async () => {
    setErrorValidacion("");
    // Validación de precios de productos
    for (const p of productosConProfit) {
      const costo = Number(p.costo);
      const precioVenta = Number(p.precioVenta);
      if (precioVenta <= costo) {
        setErrorValidacion(`El precio de venta de "${p.description}" debe ser mayor al costo ($${costo.toFixed(2)}).`);
        return;
      }
      if (precioVenta > costo * 2.5) {
        setErrorValidacion(`El precio de venta de "${p.description}" no puede ser mayor a 2.5 veces el costo ($${(costo * 2.5).toFixed(2)}).`);
        return;
      }
    }
    console.log('DEBUG registrarVenta:', {
      productosSeleccionados,
      cliente: nuevaVenta.cliente,
      clienteTrim: nuevaVenta.cliente?.trim(),
      productosLength: productosSeleccionados.length
    });
    if (productosSeleccionados.length === 0 || !nuevaVenta.cliente || !nuevaVenta.cliente.trim()) {
      alert('Por favor complete todos los campos');
      return;
    }
    if (!user.email) {
      alert('Error: No se encontró el email del usuario. Por favor, vuelve a iniciar sesión.');
      console.error('No se encontró user.email al registrar venta:', user);
      return;
    }
    console.log('Usuario actual:', user);
    // Buscar la dirección del cliente en locations
    let direccionCliente = '';
    try {
      const locations = await locationsService.getAllLocations(false);
      const clienteLoc = locations.find(loc => loc.name && loc.name.toLowerCase() === nuevaVenta.cliente.toLowerCase());
      if (clienteLoc && clienteLoc.address) {
        direccionCliente = clienteLoc.address;
        let coords = clienteLoc.lat && clienteLoc.lng ? { lat: clienteLoc.lat, lng: clienteLoc.lng } : null;
        if (!coords) {
          coords = await getLatLngFromAddress(direccionCliente);
          if (coords && clienteLoc.id) {
            await locationsService.updateLocation(clienteLoc.id, { lat: coords.lat, lng: coords.lng });
            console.log('Coordenadas guardadas en la base de datos para', clienteLoc.name, coords);
          }
        }
        console.log('Dirección del cliente:', direccionCliente);
        console.log('Resultado de la API de Google Maps o base de datos:', coords);
      } else {
        console.log('No se encontró dirección para el cliente seleccionado.');
      }
    } catch (err) {
      console.error('Error buscando dirección o geocodificando:', err);
    }

    // Definir feeSeguro localmente
    const fee = parseFloat(feeVenta);
    const feeSeguro = isNaN(fee) ? 0 : fee;

    // En registrarVenta, al construir ventaCompleta:
    const productosConPrecio = productosConProfit.map(p => {
      const prod = {
        ...p,
        precioVenta: parseFloat(p.precioVenta ?? 0) || 0,
        costo: typeof p.costo === 'number' && !isNaN(p.costo) ? p.costo : 0,
        profit: isNaN(p.profit) ? 0 : p.profit,
        comisionProducto: isNaN(p.comisionProducto) ? 0 : p.comisionProducto
      };
      // Limpia undefined en cada producto
      Object.keys(prod).forEach(k => {
        if (prod[k] === undefined) prod[k] = null;
        if (typeof prod[k] === 'string' && prod[k].trim() === '') prod[k] = '';
      });
      return prod;
    });
    const montoTotal = productosConPrecio.reduce((sum, p) => sum + ((p.precioVenta || 0) * (p.cantidad || 1)), 0);
    const comision = productosConPrecio.reduce((sum, p) => sum + (p.comisionProducto || 0), 0);
    const profitTotal = productosConPrecio.reduce((sum, p) => sum + (p.profit || 0), 0);
    const ventaCompleta = {
      ...nuevaVenta,
      monto: montoTotal,
      comision: comision,
      id: Date.now(),
      fechaRegistro: new Date().toISOString(),
      productos: productosConPrecio,
      usuarioEmail: user.email,
      identificador: user.identificador || '',
      direccionCliente,
      feeVenta: feeSeguro,
      notas: nuevaVenta.notas,
      pago: nuevaVenta.tipoPago === 'Contado' ? true : false,
      profit: profitTotal,
      // Agregar información de multipago
      multipago: nuevaVenta.metodoPago === 'Multipago' ? multipago : null
    };
    // Limpio campos undefined en ventaCompleta
    Object.keys(ventaCompleta).forEach(k => {
      if (ventaCompleta[k] === undefined) ventaCompleta[k] = null;
      if (typeof ventaCompleta[k] === 'string' && ventaCompleta[k].trim() === '') ventaCompleta[k] = '';
    });
    console.log('Datos de venta a guardar:', ventaCompleta);

    // Guardar en Firestore
    try {
      console.log('Llamando a crearVentaAmigable...');
      const nuevoId = await crearVentaAmigable(ventaCompleta);
      console.log('Venta guardada con ID:', nuevoId);
      ventaCompleta.id = nuevoId;
      setVentas(prev => prev.map(p => 
        p.id === Date.now() ? { ...p, id: nuevoId } : p
      ));
      setMostrarAlerta(true);
      // Actualizar totales
      const nuevosTotales = {
        ventasTotales: totalesGenerales.ventasTotales + montoTotal,
        comisionesTotales: totalesGenerales.comisionesTotales + comision
      };
      setTotalesGenerales(nuevosTotales);
      localStorage.setItem('totales', JSON.stringify(nuevosTotales));
      localStorage.setItem('ventas', JSON.stringify([{ ...ventaCompleta, id: nuevoId }, ...ventas]));
      // Forzar recálculo del bonus de 3 millas después de registrar la venta
      await calcularBonusTresMillas([{ ...ventaCompleta, id: nuevoId }, ...ventas]);
      // Reiniciar formulario
      setNuevaVenta({
        concepto: '',
        monto: '',
        cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        metodoPago: 'Efectivo',
        tipoPago: 'Contado',
        notas: ''
      });
      setComisionCalculada(0);
      setProductosSeleccionados([]);
      resetearMultipago();
      setTimeout(() => {
        setMostrarAlerta(false);
      }, 3000);
      // Guardar identificador del vendedor en el cliente si no tiene
      try {
        if (nuevaVenta.cliente) {
          const locations = await locationsService.getAllLocations(false);
          const clienteLoc = locations.find(loc => loc.name && loc.name.toLowerCase() === nuevaVenta.cliente.toLowerCase());
          if (clienteLoc && (!clienteLoc.vendedorIdentificador || clienteLoc.vendedorIdentificador === '')) {
            await locationsService.updateLocation(clienteLoc.id, { vendedorIdentificador: user.identificador || '' });
          }
        }
      } catch (err) {
        console.error('Error actualizando vendedor del cliente:', err);
      }
      // Forzar recarga de ventas desde Firestore para asegurar historial actualizado
      if (user.email) {
        const ventasFirestore = await cargarVentasFirestore(user.email);
        console.log('[Ventas][PostRegistro] Ventas traídas de Firestore:', ventasFirestore);
        setVentas(ventasFirestore);
        localStorage.setItem('ventas', JSON.stringify(ventasFirestore));
        // Actualizar totales también
        const ventasTotales = ventasFirestore.reduce((sum, v) => sum + (parseFloat(v.monto) || 0), 0);
        const comisionesTotales = ventasFirestore.reduce((sum, v) => sum + (parseFloat(v.comision) || 0), 0);
        setTotalesGenerales({ ventasTotales, comisionesTotales });
        localStorage.setItem('totales', JSON.stringify({ ventasTotales, comisionesTotales }));
      }

      // Verificar si se ha cumplido algún pronóstico con esta venta
      await verificarCumplimientoPronosticos(ventaCompleta);

      // Enviar datos al Google Sheet
      if (googleSheetsService.isConfigured()) {
        console.log('Enviando venta al Google Sheet...');
        const resultadoSheet = await googleSheetsService.agregarPedido(ventaCompleta);
        if (resultadoSheet) {
          console.log('Venta agregada al Google Sheet exitosamente');
        } else {
          console.log('No se pudo agregar al Google Sheet, pero la venta se guardó correctamente');
        }
      } else {
        console.log('Google Sheets no está configurado. Saltando integración.');
      }
    } catch (err) {
      console.error('Error guardando venta en Firestore:', err);
      alert('Error guardando venta en Firestore: ' + err.message);
    }
    console.log('FIN registrarVenta');
  };

  // Nueva función para verificar cumplimiento de pronósticos
  const verificarCumplimientoPronosticos = async (nuevaVenta) => {
    try {
      console.log('Verificando cumplimiento de pronósticos con nueva venta:', nuevaVenta);
      
      // 1. Obtener todos los pronósticos activos del usuario
      const forecasts = await forecastsService.getAllForecasts(user.email);
      
      if (!forecasts || forecasts.length === 0) {
        console.log('No hay pronósticos para verificar');
        return;
      }
      
      console.log(`Verificando ${forecasts.length} pronósticos`);
      
      // Obtener ventas recientes para combinar con la nueva
      const ventasRecientes = await salesService.getSalesByUserEmail(user.email);
      ventasRecientes.push(nuevaVenta); // Añadir la venta que acabamos de registrar
      
      // 2. Para cada pronóstico, verificar si se cumplió con esta nueva venta
      for (const forecast of forecasts) {
        // Obtener información básica del pronóstico
        const clientePronostico = (forecast.cliente || '').trim().toLowerCase();
        const clienteVenta = (nuevaVenta.cliente || '').trim().toLowerCase();
        
        // Solo verificamos si la venta es para el cliente del pronóstico
        if (clientePronostico !== clienteVenta) {
          continue;
        }
        
        console.log(`Verificando pronóstico para ${forecast.cliente}`);
        
        // Obtener el período actual del pronóstico
        const periodStart = forecast.periodStart ? new Date(forecast.periodStart) : 
                           (forecast.fechaRegistro ? new Date(forecast.fechaRegistro) : new Date());
        
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
        
        const periodEnd = getNextPeriod(periodStart, forecast.frecuencia);
        
        console.log(`- Período de forecast: ${periodStart.toISOString()} al ${periodEnd.toISOString()}`);
        console.log(`- Frecuencia: ${forecast.frecuencia}`);
        
        // Filtrar ventas que estén dentro del período
        const ventasPeriodo = ventasRecientes.filter(venta => {
          const fechaVenta = venta.fechaRegistro ? new Date(venta.fechaRegistro) : 
                             (venta.fecha ? new Date(venta.fecha) : new Date());
          
          const clienteMatch = venta.cliente.trim().toLowerCase() === clientePronostico;
          const fechaMatch = fechaVenta >= periodStart && fechaVenta < periodEnd;
          
          console.log(`  - Venta: Cliente="${venta.cliente}", Fecha="${fechaVenta.toISOString()}", ClienteMatch=${clienteMatch}, FechaMatch=${fechaMatch}`);
          
          return clienteMatch && fechaMatch;
        });
        
        if (ventasPeriodo.length === 0) {
          console.log(`No hay ventas en período para este pronóstico`);
          continue;
        }
        
        // Obtener todos los productos vendidos en el período
        let productosVendidos = {};
        ventasPeriodo.forEach(venta => {
          const productosVenta = venta.productos || [];
          productosVenta.forEach(prod => {
            // Usar 'code' como clave principal, pero si no existe usar 'id'
            const codigoProducto = String(prod.code || prod.id || '').trim();
            if (codigoProducto) {
              if (!productosVendidos[codigoProducto]) {
                productosVendidos[codigoProducto] = 0;
              }
              productosVendidos[codigoProducto] += Number(prod.cantidad || 0);
            }
          });
        });
        
        // Verificar si todos los productos pronosticados se cumplieron
        const productosPronosticados = forecast.productos || [];
        console.log(`- Productos pronosticados para ${forecast.cliente}:`, productosPronosticados);
        console.log(`- Productos vendidos en el período:`, productosVendidos);
        
        const todosCumplidos = productosPronosticados.every(prodPronosticado => {
          // Usar 'code' como clave principal, pero si no existe usar 'id'
          const codigoProducto = String(prodPronosticado.code || prodPronosticado.id || '').trim();
          const cantidadPronosticada = Number(prodPronosticado.cantidad || 0);
          const cantidadVendida = productosVendidos[codigoProducto] || 0;
          
          console.log(`  - Verificando producto: Code="${codigoProducto}", Pronosticado=${cantidadPronosticada}, Vendido=${cantidadVendida}`);
          
          return cantidadVendida >= cantidadPronosticada;
        });
        
        // Si se cumplieron todos los productos, actualizar la racha
        if (todosCumplidos && productosPronosticados.length > 0) {
          console.log(`🎯 ¡Pronóstico cumplido para ${forecast.cliente}!`);
          try {
            // Buscar forecast correcto en Firestore por cliente y productos
            const forecastsEnFirestore = await forecastsService.getAllForecasts(user.email);
            const forecastCorrecto = forecastsEnFirestore.find(f => 
              f.cliente === forecast.cliente &&
              f.productos && forecast.productos &&
              f.productos.length === forecast.productos.length &&
              f.productos.every(pForecast => 
                forecast.productos.some(pOriginal => 
                  (pForecast.code || pForecast.id) === (pOriginal.code || pOriginal.id) &&
                  Number(pForecast.cantidad || 0) === Number(pOriginal.cantidad || 0)
                )
              )
            );
            if (forecastCorrecto) {
              console.log(`✅ Forecast encontrado en Firestore con ID: ${forecastCorrecto.id}`);
              const newStreak = (forecastCorrecto.streak || 0) + 1;
              const resultado = await forecastsService.marcarForecastCumplido(forecastCorrecto.id);
              if (resultado) {
                console.log(`✅ Forecast marcado como cumplido exitosamente`);
                try {
                  const forecastRef = doc(db, 'forecasts', forecastCorrecto.id);
                  await updateDoc(forecastRef, {
                    streak: newStreak,
                    periodStart: new Date().toISOString(),
                    lastChecked: new Date().toISOString()
                  });
                  console.log(`📈 Racha actualizada a ${newStreak} para el forecast`);
                } catch (streakError) {
                  console.warn(`⚠️ Error actualizando racha:`, streakError);
                }
              } else {
                console.error(`❌ El servicio de forecasts no pudo marcar como cumplido`);
              }
            } else {
              console.error(`❌ No se encontró un forecast coincidente en Firestore`);
              console.log(`🔍 Forecasts disponibles:`, forecastsEnFirestore.map(f => ({
                id: f.id,
                cliente: f.cliente,
                productos: f.productos?.map(p => ({
                  code: p.code || p.id,
                  cantidad: p.cantidad
                }))
              })));
              console.log(`🔍 Forecast buscado:`, {
                cliente: forecast.cliente,
                productos: forecast.productos?.map(p => ({
                  code: p.code || p.id,
                  cantidad: p.cantidad
                }))
              });
            }
          } catch (updateError) {
            console.error(`💥 Error completo actualizando pronóstico:`, updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error verificando pronósticos:', error);
    }
  };

  const navegarA = (ruta) => {
    navigate(ruta);
  };

  // Calcular cantidad de bonus activos, incluyendo forecast y clientes cercanos
  const cantidadBonus = [cumpleBonusEfectivo, cumpleBonusContado, bonusForecastRaw > 0, cumpleBonusTresMillas].filter(Boolean).length;
  const mensajeBonus = cantidadBonus > 0 ? `Bonus activo: +${cantidadBonus}% extra 🚀` : null;
  const textoForecastBonus = bonusForecastRaw > 0 ? '+1% forecast' : '0% forecast';
  const textoClientesCercanos = cumpleBonusTresMillas ? '+1% clientes cercanos' : '0% clientes cercanos';

  // Actualizar dirección al seleccionar cliente
  useEffect(() => {
    async function fetchDireccionCliente() {
      if (!nuevaVenta.cliente || !nuevaVenta.cliente.trim()) {
        setDireccionCliente("");
        setIdClienteSeleccionado(null);
        return;
      }
      try {
        const locations = await locationsService.getAllLocations(false);
        const clienteLoc = locations.find(loc => loc.name && loc.name.toLowerCase() === nuevaVenta.cliente.toLowerCase());
        if (clienteLoc) {
          setDireccionCliente(clienteLoc.address || "");
          setNuevaDireccion(clienteLoc.address || "");
          setIdClienteSeleccionado(clienteLoc.id);
        } else {
          setDireccionCliente("");
          setNuevaDireccion("");
          setIdClienteSeleccionado(null);
        }
      } catch (err) {
        setDireccionCliente("");
        setIdClienteSeleccionado(null);
      }
    }
    fetchDireccionCliente();
  }, [nuevaVenta.cliente]);

  // Agregar función para calcular comisión si no existe
  function calcularComision(monto) {
    return monto * comisionRate;
  }

  const marcarComoPagada = (venta) => {
    setVentaParaPagar(venta);
    setMetodoPagoReal(venta.metodoPago || 'Efectivo');
    setMostrarModalPago(true);
  };

  const confirmarPago = async () => {
    if (!ventaParaPagar) return;
    
    try {
      // Actualizar la venta con el método de pago real
      const datosActualizacion = {
        pago: true,
        metodoPagoReal: metodoPagoReal,
        multipago: metodoPagoReal === 'Multipago' ? multipagoReal : null
      };
      
      await salesService.actualizarVenta(ventaParaPagar.id, datosActualizacion);
      setVentas(ventas.map(v => v.id === ventaParaPagar.id ? { ...v, ...datosActualizacion } : v));
      
      // Cerrar modal y resetear
      setMostrarModalPago(false);
      setVentaParaPagar(null);
      setMetodoPagoReal('Efectivo');
      setMultipagoReal([{ metodo: 'Efectivo', monto: '' }]);
    } catch (err) {
      alert('Error al marcar como pagada: ' + err.message);
    }
  };

  const cancelarPago = () => {
    setMostrarModalPago(false);
    setVentaParaPagar(null);
    setMetodoPagoReal('Efectivo');
    setMultipagoReal([{ metodo: 'Efectivo', monto: '' }]);
  };

  // Funciones para editar ventas
  const abrirModalEdicion = (venta) => {
    setVentaParaEditar(venta);
    setVentaEditada({
      concepto: venta.concepto || '',
      cliente: venta.cliente || '',
      fecha: venta.fecha || '',
      metodoPago: venta.metodoPago || 'Efectivo',
      tipoPago: venta.tipoPago || 'Contado',
      notas: venta.notas || '',
      productos: venta.productos ? [...venta.productos] : []
    });
    setMostrarModalEdicion(true);
  };

  const cerrarModalEdicion = () => {
    setMostrarModalEdicion(false);
    setVentaParaEditar(null);
    setVentaEditada({
      concepto: '',
      cliente: '',
      fecha: '',
      metodoPago: 'Efectivo',
      tipoPago: 'Contado',
      notas: '',
      productos: []
    });
    setGuardandoEdicion(false);
  };

  const handleCambioEdicion = (campo, valor) => {
    setVentaEditada(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleCambioProductoEdicion = (index, campo, valor) => {
    setVentaEditada(prev => ({
      ...prev,
      productos: prev.productos.map((producto, i) => 
        i === index ? { ...producto, [campo]: valor } : producto
      )
    }));
  };

  const eliminarProductoEdicion = (index) => {
    setVentaEditada(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index)
    }));
  };

  const recalcularVentaEditada = () => {
    const productosConCalculos = ventaEditada.productos.map(p => {
      const costo = obtenerCostoProducto(p, user) ?? 0;
      const precioVenta = parseFloat(p.precioVenta) || 0;
      const cantidad = parseFloat(p.cantidad) || 1;
      const profit = (precioVenta - costo) * cantidad;
      const comisionProducto = profit > 0 ? profit * comisionRate : 0;
      
      return {
        ...p,
        costo,
        profit: isNaN(profit) ? 0 : profit,
        comisionProducto: isNaN(comisionProducto) ? 0 : comisionProducto
      };
    });

    const montoTotal = productosConCalculos.reduce((sum, p) => sum + ((p.precioVenta || 0) * (p.cantidad || 1)), 0);
    const comisionTotal = productosConCalculos.reduce((sum, p) => sum + (p.comisionProducto || 0), 0);
    const profitTotal = productosConCalculos.reduce((sum, p) => sum + (p.profit || 0), 0);

    return {
      monto: montoTotal,
      comision: comisionTotal,
      profit: profitTotal,
      productos: productosConCalculos
    };
  };

  const guardarEdicionVenta = async () => {
    if (!ventaParaEditar || guardandoEdicion) return;
    
    setGuardandoEdicion(true);
    
    try {
      const calculosVenta = recalcularVentaEditada();
      
      const datosActualizacion = {
        concepto: ventaEditada.concepto,
        cliente: ventaEditada.cliente,
        fecha: ventaEditada.fecha,
        metodoPago: ventaEditada.metodoPago,
        tipoPago: ventaEditada.tipoPago,
        notas: ventaEditada.notas,
        monto: calculosVenta.monto,
        comision: calculosVenta.comision,
        profit: calculosVenta.profit,
        productos: calculosVenta.productos
      };

      // Actualizar en Firestore
      await salesService.actualizarVenta(ventaParaEditar.id, datosActualizacion);
      
      // Actualizar en el estado local
      setVentas(ventas.map(v => 
        v.id === ventaParaEditar.id ? { ...v, ...datosActualizacion } : v
      ));

      // Recalcular totales
      const ventasActualizadas = ventas.map(v => 
        v.id === ventaParaEditar.id ? { ...v, ...datosActualizacion } : v
      );
      const ventasTotales = ventasActualizadas.reduce((sum, v) => sum + (parseFloat(v.monto) || 0), 0);
      const comisionesTotales = ventasActualizadas.reduce((sum, v) => sum + (parseFloat(v.comision) || 0), 0);
      setTotalesGenerales({ ventasTotales, comisionesTotales });
      localStorage.setItem('totales', JSON.stringify({ ventasTotales, comisionesTotales }));
      localStorage.setItem('ventas', JSON.stringify(ventasActualizadas));

      cerrarModalEdicion();
      
      // Mostrar confirmación
      setMostrarAlerta(true);
      setTimeout(() => setMostrarAlerta(false), 3000);
      
    } catch (err) {
      console.error('Error actualizando venta:', err);
      alert('Error al actualizar la venta: ' + err.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Filtrar ventas por cliente para el historial
  const ventasFiltradas = ventas.filter(venta => {
    // Filtro por cliente
    const clienteOk = !filtroClienteHistorial.trim() || 
      (venta.cliente && venta.cliente.toLowerCase().includes(filtroClienteHistorial.toLowerCase()));
    
    // Filtro por fecha
    const fechaOk = !filtroFechaHistorial || 
      (venta.fecha && new Date(venta.fecha).toLocaleDateString() === new Date(filtroFechaHistorial).toLocaleDateString());
    
    // Filtro por método de pago
    const metodoOk = !filtroMetodoPagoHistorial || 
      (venta.metodoPago && venta.metodoPago === filtroMetodoPagoHistorial);
    
    // Filtro por tipo de pago
    const tipoOk = !filtroTipoPagoHistorial || 
      (venta.tipoPago && venta.tipoPago === filtroTipoPagoHistorial);
    
    return clienteOk && fechaOk && metodoOk && tipoOk;
  });

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
          <button 
            className="sidebar-link" 
            onClick={() => navegarA('/')}
          >
            <FiHome className="nav-icon" /> <span>Inicio</span>
          </button>
          <button 
            className="sidebar-link active" 
            onClick={() => navegarA('/ventas')}
          >
            <FiShoppingBag className="nav-icon" /> <span>Ventas</span>
          </button>
          <button className="sidebar-link" onClick={() => navegarA('/forecast')}>
            <FiBarChart2 className="nav-icon" /> <span>Forecast</span>
          </button>
          <button className="sidebar-link" onClick={() => navegarA('/clientes')}>
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
          {user.admin && (
            <button className="sidebar-link" onClick={() => navegarA('/metricas-financieras')}>
              <FiTrendingUp className="nav-icon" /> <span>Métricas Financieras</span>
            </button>
          )}
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
              <h4 className="mb-0">Registro de Ventas</h4>
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
            {/* LEYENDA INFORMATIVA DE COMISIONES Y % */}
            {bonusOn && (
              <Alert variant="info" className="mb-4 shadow-sm border-0">
                <Alert.Heading className="d-flex align-items-center">
                  <FiDollarSign className="me-2 text-primary" /> ¿Cómo puedes subir tu % de comisiones?
                </Alert.Heading>
                <ul className="mb-2">
                  <li>
                    <strong>80% de tus ventas son en efectivo:</strong> Incentiva a tus clientes a pagar en efectivo para aumentar tu porcentaje de comisión (+1%).
                  </li>
                  <li>
                    <strong>80% de tus ventas son de contado:</strong> Si la mayoría de tus ventas son de contado (no a crédito), tu comisión sube (+1%).
                  </li>
                  <li>
                    <strong>80% de tus clientes están en un radio de 3 millas:</strong> Mantén tu cartera de clientes cerca para optimizar entregas y mejorar tu comisión (+1%).
                  </li>
                  <li>
                    <strong>Forecast de pedidos exactos:</strong> Si logras anticipar con exactitud los pedidos de tus clientes (por ejemplo: "Auto repair necesita 3 cajas de 15w-40 cada mes"), tu comisión aumentará. ¡Pronto podrás registrar tus forecasts desde aquí! (+1%).
                  </li>
                </ul>
                <div className="small text-muted">
                  Cada bonus suma 1% a tu comisión. Si cumples todos, ¡puedes llegar hasta un 24% de comisión mensual!
                </div>
              </Alert>
            )}

            {mostrarAlerta && (
              <Alert 
                variant="success" 
                className="shadow-sm border-0 mb-4"
                onClose={() => setMostrarAlerta(false)} 
                dismissible
              >
                <Alert.Heading className="d-flex align-items-center">
                  <FiCheck className="me-2" /> ¡Venta registrada con éxito!
                </Alert.Heading>
                <p className="mb-0">
                  La venta ha sido registrada correctamente. <br />
                  Se ha calculado una comisión de <strong className="text-success">${comisionCalculada.toFixed(2)}</strong>.
                </p>
              </Alert>
            )}

            {errorValidacion && (
              <Alert variant="danger" className="mb-3">
                {errorValidacion}
              </Alert>
            )}

            <Row>
              {/* Formulario de Registro de Venta */}
              <Col lg={7} xl={8}>
                <div className="dashboard-panel">
                  <div className="panel-header py-2">
                    <h2 className="d-flex align-items-center">
                      <FiPlus className="me-2 text-primary" /> 
                      Nueva Venta
                    </h2>
                  </div>
                  <div className="panel-body py-4">
                    <Row className="g-4 form-spacing">
                      {/* Input de búsqueda de cliente con autocompletado */}
                      <Col md={12} className="mb-3">
                        <div className="input-group mb-2 shadow-sm position-relative">
                          <Form.Control
                            type="text"
                            placeholder="Buscar cliente..."
                            value={nuevaVenta.cliente}
                            onChange={handleClienteInputChange}
                            onKeyDown={handleClienteKeyDown}
                            className="bg-light form-control-sm"
                            autoComplete="off"
                            ref={clienteInputRef}
                          />
                          <span className="input-group-text bg-light">
                            <FiUser className="text-primary me-1" /> Cliente
                          </span>
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
                                  key={c.nombre}
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
                        {/* Mostrar dirección debajo del input de cliente */}
                        {nuevaVenta.cliente && direccionCliente && !editandoDireccion && (
                          <div style={{ marginTop: 4, marginLeft: 2, fontSize: 14, color: '#555' }}>
                            <span>Dirección: {direccionCliente}</span>
                            <Button
                              variant="link"
                              size="sm"
                              style={{ marginLeft: 8, padding: 0, fontSize: 13 }}
                              onClick={() => setEditandoDireccion(true)}
                            >
                              Editar dirección
                            </Button>
                          </div>
                        )}
                        {nuevaVenta.cliente && editandoDireccion && (
                          <div style={{ marginTop: 4, marginLeft: 2 }}>
                            <Form.Control
                              type="text"
                              value={nuevaDireccion}
                              onChange={e => setNuevaDireccion(e.target.value)}
                              size="sm"
                              style={{ maxWidth: 350, display: 'inline-block' }}
                              disabled={guardandoDireccion}
                            />
                            <Button
                              variant="success"
                              size="sm"
                              style={{ marginLeft: 8 }}
                              disabled={guardandoDireccion || !nuevaDireccion.trim() || !idClienteSeleccionado}
                              onClick={async () => {
                                setGuardandoDireccion(true);
                                setErrorDireccion("");
                                try {
                                  await locationsService.updateLocation(idClienteSeleccionado, { address: nuevaDireccion });
                                  setDireccionCliente(nuevaDireccion);
                                  setEditandoDireccion(false);
                                } catch (err) {
                                  setErrorDireccion("Error al guardar la dirección");
                                } finally {
                                  setGuardandoDireccion(false);
                                }
                              }}
                            >
                              Guardar
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              style={{ marginLeft: 4 }}
                              onClick={() => {
                                setEditandoDireccion(false);
                                setNuevaDireccion(direccionCliente);
                              }}
                              disabled={guardandoDireccion}
                            >
                              Cancelar
                            </Button>
                            {errorDireccion && <div style={{ color: 'red', fontSize: 13, marginTop: 2 }}>{errorDireccion}</div>}
                          </div>
                        )}
                      </Col>
                      {/* Input de búsqueda de productos con autocompletado y lista de productos seleccionados */}
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
                            {productosConProfit.map((p) => (
                              <div key={p.id} className="mb-3">
                                <div className="d-flex align-items-center mb-1" style={{gap: 8}}>
                                  <span style={{flex: 1}}>
                                    {p.description}
                                    <span style={{color: '#888', fontSize: 13, marginLeft: 8}}>
                                      (Costo: ${Number(p.costo).toFixed(2)})
                                    </span>
                                  </span>
                                  <div style={{width: 70, marginRight: 8}}>
                                    <div style={{fontSize: 11, color: '#666', marginBottom: 2}}>Cantidad</div>
                                    <Form.Control
                                      type="number"
                                      min={1}
                                      value={p.cantidad}
                                      onChange={e => handleCantidadChange(p.id, Number(e.target.value))}
                                      className="form-control-sm"
                                    />
                                  </div>
                                  <div style={{width: 90, marginRight: 8}}>
                                    <div style={{fontSize: 11, color: '#666', marginBottom: 2}}>Precio de venta</div>
                                    <Form.Control
                                      type="number"
                                      min={0}
                                      value={p.precioVenta === undefined || p.precioVenta === null ? '' : p.precioVenta}
                                      onChange={e => {
                                        const value = e.target.value;
                                        setProductosSeleccionados(productosSeleccionados.map(prod => prod.id === p.id ? { ...prod, precioVenta: value } : prod));
                                      }}
                                      className="form-control-sm"
                                      placeholder="Precio"
                                    />
                                  </div>
                                  <Button variant="outline-danger" size="sm" onClick={() => handleEliminarProducto(p.id)}>
                                    Quitar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="input-group mb-2 shadow-sm">
                          <Form.Control
                            type="date"
                            id="fecha"
                            name="fecha"
                            value={nuevaVenta.fecha}
                            onChange={handleInputChange}
                            className="bg-light form-control-sm"
                          />
                          <span className="input-group-text bg-light">
                            <FiCalendar className="text-primary me-1" /> Fecha
                          </span>
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="input-group mb-2 shadow-sm">
                          <Form.Control
                            type="text"
                            id="metodoPago"
                            name="metodoPago"
                            value={nuevaVenta.metodoPago}
                            onChange={handleInputChange}
                            className="bg-light form-control-sm"
                            as="select"
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Multipago">Multipago</option>
                          </Form.Control>
                          <span className="input-group-text bg-light">
                            <FiCreditCard className="text-primary me-1" /> Método de Pago
                          </span>
                        </div>
                        {/* Componente de multipago */}
                        {nuevaVenta.metodoPago === 'Multipago' && (
                          <div className="mt-2">
                            <small className="text-muted mb-2 d-block">Dividir pago entre métodos:</small>
                            {multipago.map((metodo, index) => (
                              <div key={index} className="d-flex align-items-center mb-2" style={{gap: 8}}>
                                <Form.Control
                                  as="select"
                                  value={metodo.metodo}
                                  onChange={(e) => actualizarMetodoPago(index, 'metodo', e.target.value)}
                                  className="form-control-sm"
                                  style={{width: 120}}
                                >
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Tarjeta">Tarjeta</option>
                                  <option value="Transferencia">Transferencia</option>
                                  <option value="Cheque">Cheque</option>
                                </Form.Control>
                                <Form.Control
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  placeholder="Monto"
                                  value={metodo.monto}
                                  onChange={(e) => actualizarMetodoPago(index, 'monto', e.target.value)}
                                  className="form-control-sm"
                                  style={{width: 100}}
                                />
                                {multipago.length > 1 && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => eliminarMetodoPago(index)}
                                  >
                                    Quitar
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={agregarMetodoPago}
                              className="mt-1"
                            >
                              + Agregar método
                            </Button>
                          </div>
                        )}
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="input-group mb-2 shadow-sm">
                          <Form.Control
                            id="tipoPago"
                            name="tipoPago"
                            value={nuevaVenta.tipoPago}
                            onChange={handleInputChange}
                            className="bg-light form-control-sm"
                            as="select"
                          >
                            <option value="Contado">Contado</option>
                            <option value="Crédito">Crédito</option>
                          </Form.Control>
                          <span className="input-group-text bg-light">
                            <FiDollarSign className="text-primary me-1" /> Tipo de Pago
                          </span>
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="input-group mb-2 shadow-sm">
                          <Form.Control
                            type="number"
                            min={0}
                            step="0.01"
                            value={feeVenta}
                            onChange={e => setFeeVenta(e.target.value)}
                            className="bg-light form-control-sm"
                            placeholder="Fee de venta"
                          />
                          <span className="input-group-text bg-light fw-bold">
                            Fee de venta
                          </span>
                        </div>
                      </Col>
                      <Col md={12} className="mb-3">
                        <Form.Group controlId="notasVenta">
                          <Form.Label>Notas (opcional)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Agrega una nota para esta venta..."
                            value={nuevaVenta.notas}
                            onChange={e => setNuevaVenta({ ...nuevaVenta, notas: e.target.value })}
                            className="form-control-sm"
                            style={{ resize: 'vertical', minHeight: 38 }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="comision-card-xs my-4 shadow-sm">
                      <div className="comision-icon-xs">
                        <FiDollarSign />
                      </div>
                      <div className="comision-details">
                        <h6>Comisión calculada ({Math.round(comisionRate*100)}%):</h6>
                        <h3 className="text-success mb-0">${!isNaN(comisionCalculada) && isFinite(comisionCalculada) ? comisionCalculada.toFixed(2) : '0.00'}</h3>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                      <Button 
                        variant="primary"
                        className="px-4 py-2 register-btn rounded-pill"
                        onClick={registrarVenta}
                        disabled={productosSeleccionados.length === 0 || !nuevaVenta.cliente || !nuevaVenta.cliente.trim()}
                      >
                        <FiCheck className="me-2" /> Registrar Venta
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Resumen e Información */}
              <Col lg={5} xl={4}>
                <div className="dashboard-panel mb-3" style={{ paddingBottom: 32, minHeight: 420 }}>
                  <div className="panel-header py-2">
                    <h2 className="d-flex align-items-center">
                      <FiCreditCard className="me-2 text-primary" /> 
                      Resumen
                    </h2>
                  </div>
                  <div className="panel-body p-0">
                    <div className="summary-container">
                      <div className="summary-item">
                        <div className="summary-icon summary-icon-blue">
                          <FiShoppingBag />
                        </div>
                        <div className="summary-content">
                          <h3>${totalesGenerales.ventasTotales.toFixed(2)}</h3>
                          <p>Ventas Totales</p>
                        </div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-icon summary-icon-green">
                          <FiDollarSign />
                        </div>
                        <div className="summary-content">
                          <h3>${totalesGenerales.comisionesTotales.toFixed(2)}</h3>
                          <p>Total Retirable (Comisión {Math.round(comisionRate*100)}%)</p>
                        </div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-icon summary-icon-orange">
                          <FiTruck />
                        </div>
                        <div className="summary-content">
                          <h3>{ventas.length}</h3>
                          <p>Ventas Realizadas</p>
                        </div>
                      </div>
                    </div>
                    {/* Porcentaje de ventas en efectivo y bonus */}
                    {bonusOn && (
                      <div className="mt-3 px-3">
                        <div className="small mb-1">
                          <strong>% de ventas en efectivo:</strong> {porcentajeEfectivo.toFixed(1)}%
                        </div>
                        <div className="small mb-1">
                          <strong>% de ventas de contado:</strong> {porcentajeContado.toFixed(1)}%
                        </div>
                        <div className="small fw-bold mb-1" style={{ textAlign: 'left', paddingLeft: 8 }}>
                          {textoForecastBonus}
                        </div>
                        <div className="small fw-bold mb-2" style={{ textAlign: 'left', paddingLeft: 8 }}>
                          {textoClientesCercanos}
                        </div>
                        {mensajeBonus && (
                          <Alert variant="success" className="py-2 px-3 mb-0 text-center fw-bold">
                            {mensajeBonus}
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            {/* Historial de Ventas */}
            <div className="dashboard-panel" id="historial-ventas">
              <div className="panel-header py-2 d-flex justify-content-between align-items-center">
                <h2 className="d-flex align-items-center">
                  <FiFileText className="me-2 text-primary" /> 
                  Historial de Ventas
                </h2>
                <div className="d-flex align-items-center gap-3">
                  {ventas.length > 0 && (
                    <>
                      <Form.Control
                        type="text"
                        placeholder="Filtrar por cliente..."
                        value={filtroClienteHistorial}
                        onChange={(e) => setFiltroClienteHistorial(e.target.value)}
                        className="form-control-sm"
                        style={{ width: 150 }}
                      />
                      <Form.Control
                        type="date"
                        value={filtroFechaHistorial}
                        onChange={(e) => setFiltroFechaHistorial(e.target.value)}
                        className="form-control-sm"
                        style={{ width: 140 }}
                      />
                      <Form.Select
                        value={filtroMetodoPagoHistorial}
                        onChange={(e) => setFiltroMetodoPagoHistorial(e.target.value)}
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
                        value={filtroTipoPagoHistorial}
                        onChange={(e) => setFiltroTipoPagoHistorial(e.target.value)}
                        className="form-control-sm"
                        style={{ width: 120 }}
                      >
                        <option value="">Tipo</option>
                        <option value="Contado">Contado</option>
                        <option value="Crédito">Crédito</option>
                      </Form.Select>
                    </>
                  )}
                  {ventas.length > 0 && (
                    <div className="text-muted small">
                      {ventasFiltradas.length} de {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
                    </div>
                  )}
                </div>
              </div>
              <div className="panel-body p-0">
                {ventasFiltradas.length > 0 ? (
                  <Table responsive hover className="mb-0 table-modern">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3 text-center">Fecha</th>
                        <th className="py-3 text-center">Concepto</th>
                        <th className="py-3 text-center">Cliente</th>
                        <th className="py-3 text-center">Método</th>
                        <th className="py-3 text-center">Tipo</th>
                        <th className="py-3 text-center">Monto</th>
                        <th className="py-3 text-center">Comisión</th>
                        <th className="py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasFiltradas.map(venta => (
                        <tr key={venta.id} style={!venta.pago && venta.tipoPago === 'Crédito' ? { background: '#fffbe6' } : {}}>
                          <td className="py-3 text-center">{new Date(venta.fecha).toLocaleDateString()}</td>
                          <td className="py-3 text-center">{venta.concepto}</td>
                          <td className="py-3 text-center">{venta.cliente}</td>
                          <td className="py-3 text-center">{venta.metodoPago || 'Efectivo'}</td>
                          <td className="py-3 text-center">{venta.tipoPago || 'Contado'}</td>
                          <td className="py-3 text-center">${venta.monto.toFixed(2)}</td>
                          <td className="py-3 text-center text-success">${venta.comision.toFixed(2)}</td>
                          <td className="py-3 text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                onClick={() => abrirModalEdicion(venta)}
                                title="Editar venta"
                              >
                                <FiEdit2 />
                              </Button>
                              {venta.tipoPago === 'Crédito' && !venta.pago && (
                                <Button 
                                  size="sm" 
                                  variant="warning" 
                                  onClick={() => marcarComoPagada(venta)}
                                  title="Marcar como pagada"
                                >
                                  <FiCheck />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light table-footer">
                      <tr>
                        <td colSpan="5" className="fw-bold py-3 text-start">Totales {filtroClienteHistorial ? '(filtrados)' : ''}:</td>
                        <td className="text-center fw-bold py-3">
                          ${ventasFiltradas.reduce((sum, venta) => sum + venta.monto, 0).toFixed(2)}
                        </td>
                        <td className="text-center fw-bold text-success py-3">
                          ${ventasFiltradas.reduce((sum, venta) => sum + venta.comision, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                ) : (
                  <div className="text-center py-5">
                    <div className="activity-empty">
                      <div className="empty-icon">
                        <FiShoppingBag />
                      </div>
                      {filtroClienteHistorial ? (
                        <>
                          <h3>No se encontraron ventas</h3>
                          <p className="text-muted mb-4">No hay ventas que coincidan con el filtro "{filtroClienteHistorial}".</p>
                        </>
                      ) : (
                        <>
                          <h3>No hay ventas registradas</h3>
                          <p className="text-muted mb-4">Registra tu primera venta utilizando el formulario.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </div>
      </main>

      {/* Modal para seleccionar método de pago al marcar como pagada */}
      {mostrarModalPago && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar pago</h5>
                <button type="button" className="btn-close" onClick={cancelarPago}></button>
              </div>
              <div className="modal-body">
                <p>¿Cómo pagó el cliente esta venta?</p>
                
                <div className="mb-3">
                  <label className="form-label">Método de pago</label>
                  <Form.Control
                    as="select"
                    value={metodoPagoReal}
                    onChange={(e) => setMetodoPagoReal(e.target.value)}
                    className="form-control"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Multipago">Multipago</option>
                  </Form.Control>
                </div>

                {/* Componente de multipago para método de pago real */}
                {metodoPagoReal === 'Multipago' && (
                  <div className="mt-3">
                    <label className="form-label">Dividir pago entre métodos:</label>
                    {multipagoReal.map((metodo, index) => (
                      <div key={index} className="d-flex align-items-center mb-2" style={{gap: 8}}>
                        <Form.Control
                          as="select"
                          value={metodo.metodo}
                          onChange={(e) => actualizarMetodoPagoReal(index, 'metodo', e.target.value)}
                          className="form-control-sm"
                          style={{width: 120}}
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Cheque">Cheque</option>
                        </Form.Control>
                        <Form.Control
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Monto"
                          value={metodo.monto}
                          onChange={(e) => actualizarMetodoPagoReal(index, 'monto', e.target.value)}
                          className="form-control-sm"
                          style={{width: 100}}
                        />
                        {multipagoReal.length > 1 && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => eliminarMetodoPagoReal(index)}
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={agregarMetodoPagoReal}
                      className="mt-1"
                    >
                      + Agregar método
                    </Button>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={cancelarPago}>
                  Cancelar
                </Button>
                <Button variant="success" onClick={confirmarPago}>
                  Confirmar pago
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar venta */}
      {mostrarModalEdicion && ventaParaEditar && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FiEdit2 className="me-2" />
                  Editar Venta
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModalEdicion}></button>
              </div>
              <div className="modal-body">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Concepto</Form.Label>
                      <Form.Control
                        type="text"
                        value={ventaEditada.concepto}
                        onChange={(e) => handleCambioEdicion('concepto', e.target.value)}
                        placeholder="Descripción de la venta"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cliente</Form.Label>
                      <Form.Control
                        type="text"
                        value={ventaEditada.cliente}
                        onChange={(e) => handleCambioEdicion('cliente', e.target.value)}
                        placeholder="Nombre del cliente"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha</Form.Label>
                      <Form.Control
                        type="date"
                        value={ventaEditada.fecha}
                        onChange={(e) => handleCambioEdicion('fecha', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Método de Pago</Form.Label>
                      <Form.Control
                        as="select"
                        value={ventaEditada.metodoPago}
                        onChange={(e) => handleCambioEdicion('metodoPago', e.target.value)}
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Multipago">Multipago</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Pago</Form.Label>
                      <Form.Control
                        as="select"
                        value={ventaEditada.tipoPago}
                        onChange={(e) => handleCambioEdicion('tipoPago', e.target.value)}
                      >
                        <option value="Contado">Contado</option>
                        <option value="Crédito">Crédito</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Notas</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={ventaEditada.notas}
                    onChange={(e) => handleCambioEdicion('notas', e.target.value)}
                    placeholder="Notas adicionales..."
                  />
                </Form.Group>

                {/* Productos */}
                <div className="mb-3">
                  <h6 className="d-flex align-items-center">
                    <FiShoppingBag className="me-2" />
                    Productos ({ventaEditada.productos.length})
                  </h6>
                  
                  {ventaEditada.productos.length > 0 ? (
                    <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {ventaEditada.productos.map((producto, index) => (
                        <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded">
                          <div className="flex-grow-1">
                            <strong>{producto.description || producto.nombre || 'Producto sin nombre'}</strong>
                            <div className="small text-muted">
                              Costo: ${(producto.costo || 0).toFixed(2)}
                            </div>
                          </div>
                          <div style={{ width: 80, marginRight: 8 }}>
                            <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Cantidad</div>
                            <Form.Control
                              type="number"
                              min={1}
                              value={producto.cantidad || 1}
                              onChange={(e) => handleCambioProductoEdicion(index, 'cantidad', e.target.value)}
                              className="form-control-sm text-center"
                            />
                          </div>
                          <div style={{ width: 90, marginRight: 8 }}>
                            <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Precio venta</div>
                            <Form.Control
                              type="number"
                              min={0}
                              step="0.01"
                              value={producto.precioVenta || ''}
                              onChange={(e) => handleCambioProductoEdicion(index, 'precioVenta', e.target.value)}
                              className="form-control-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => eliminarProductoEdicion(index)}
                            title="Eliminar producto"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3 border rounded">
                      No hay productos en esta venta
                    </div>
                  )}
                </div>

                {/* Resumen de cálculos */}
                {ventaEditada.productos.length > 0 && (
                  <div className="bg-light p-3 rounded">
                    <Row>
                      <Col md={4}>
                        <strong>Monto Total: ${recalcularVentaEditada().monto.toFixed(2)}</strong>
                      </Col>
                      <Col md={4}>
                        <strong className="text-success">Comisión: ${recalcularVentaEditada().comision.toFixed(2)}</strong>
                      </Col>
                      <Col md={4}>
                        <strong className="text-info">Profit: ${recalcularVentaEditada().profit.toFixed(2)}</strong>
                      </Col>
                    </Row>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={cerrarModalEdicion} disabled={guardandoEdicion}>
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={guardarEdicionVenta}
                  disabled={guardandoEdicion || !ventaEditada.cliente || !ventaEditada.concepto}
                >
                  {guardandoEdicion ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiCheck className="me-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas; 