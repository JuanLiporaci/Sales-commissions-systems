import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Lógica de cálculo de métricas (puedes ajustar los valores base)
function calcularMetricas(params: any) {
  const {
    tasaChurn,
    inversionMarketing,
    nuevosClientes,
    margenBruto,
    ticketPromedio,
    recurrenciaCompra,
    ventasMensuales
  } = params;

  const cac = nuevosClientes > 0 ? inversionMarketing / nuevosClientes : 0;
  const lifeTime = tasaChurn > 0 ? 100 / tasaChurn : 0;
  const ltv = ticketPromedio * recurrenciaCompra * lifeTime;
  const lifv = ltv * (margenBruto / 100);
  const cacPaybackPeriod = cac > 0 ? cac / (ticketPromedio * recurrenciaCompra * (margenBruto / 100)) : 0;

  return {
    cac,
    ltv,
    lifv,
    lifeTime,
    cacPaybackPeriod,
    tasaChurn,
    inversionMarketing,
    nuevosClientes,
    margenBruto,
    ticketPromedio,
    recurrenciaCompra,
    ventasMensuales,
    fechaCalculo: new Date().toISOString(),
  };
}

export const actualizarMetricasFinancierasDiarias = onSchedule(
  { schedule: 'every day 02:00' },
  async (event) => {
  // 1. Obtener todos los usuarios
  const usuariosSnap = await db.collection('usuarios').get();
  type Usuario = { id: string; email: string; [key: string]: any };
  const usuarios = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));

  for (const user of usuarios) {
    const userEmail = user.email;
    // 2. Obtener ventas y clientes del día
    const ventasSnap = await db.collection('ventas').where('usuarioEmail', '==', userEmail).get();
    const ventas = ventasSnap.docs.map(doc => doc.data());
    const clientesSnap = await db.collection('customers').get();
    const clientes = clientesSnap.docs.map(doc => doc.data());

    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();

    // Filtrar ventas y clientes del día
    const ventasHoy = ventas.filter((v: any) => {
      const fecha = v.fecha ? new Date(v.fecha) : (v.date ? new Date(v.date) : null);
      return fecha && fecha.getDate() === dia && fecha.getMonth() === mes && fecha.getFullYear() === anio;
    });
    const clientesHoy = clientes.filter((c: any) => {
      const fecha = c.fechaRegistro ? new Date(c.fechaRegistro) : (c.createdAt ? new Date(c.createdAt) : null);
      return fecha && fecha.getDate() === dia && fecha.getMonth() === mes && fecha.getFullYear() === anio;
    });

    // Calcular ticket promedio y ventas del día
    const totalVentasHoy = ventasHoy.reduce((sum: number, v: any) => sum + (parseFloat(v.monto) || 0), 0);
    const ticketPromedio = ventasHoy.length > 0 ? totalVentasHoy / ventasHoy.length : 0;
    const ventasDiarias = totalVentasHoy;
    const nuevosClientes = clientesHoy.length;
    const clientesUnicosConVenta = new Set(ventasHoy.map((v: any) => v.clienteId || v.cliente || v.customerId)).size;
    const recurrenciaCompra = clientesUnicosConVenta > 0 ? ventasHoy.length / clientesUnicosConVenta : 0;

    // Puedes ajustar estos valores base según tu lógica de negocio
    const valores = {
      tasaChurn: 5,
      inversionMarketing: 5000,
      nuevosClientes,
      margenBruto: 40,
      ticketPromedio,
      ventasMensuales: ventasDiarias,
      recurrenciaCompra,
      modoCalculoAutomatico: true,
    };

    // 3. Calcular métricas
    const metricasCalculadas = calcularMetricas(valores);

    // 4. Guardar métricas en Firestore (como registro diario)
    const fechaStr = hoy.toISOString().split('T')[0];
    await db.doc(`metricas/financieras/diarias/${fechaStr}`).set({
      ...metricasCalculadas,
      usuarioEmail: userEmail,
      fechaCalculo: hoy.toISOString(),
    }, { merge: true });

    // También guardar en historial
    await db.collection('metricas/financieras/historial').add({
      ...metricasCalculadas,
      usuarioEmail: userEmail,
      fecha: hoy.toISOString(),
    });
  }
});

export const register = async (email: string, password: string, fullName: string) => {
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });

    // Guardar usuario en Firestore
    await db.collection('usuarios').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: fullName,
      photoURL: userRecord.photoURL || '',
      creado: new Date().toISOString()
    }, { merge: true });

    return userRecord;
  } catch (error: any) {
    // ...manejo de errores igual
  }
}; 