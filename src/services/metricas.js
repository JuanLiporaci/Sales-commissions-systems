import { collection, doc, setDoc, addDoc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

class MetricasService {
  
  // Calcular métricas financieras
  async calcularMetricas(params) {
    const {
      tasaChurn,
      inversionMarketing,
      nuevosClientes,
      margenBruto,
      ticketPromedio,
      recurrenciaCompra,
      ventasMensuales
    } = params;
    
    // CAC - Customer Acquisition Cost
    const cac = nuevosClientes > 0 ? inversionMarketing / nuevosClientes : 0;
    
    // Life Time (en meses) - Cuánto tiempo permanece un cliente
    const lifeTime = tasaChurn > 0 ? 100 / tasaChurn : 0; // 100/Churn%
    
    // LTV - Lifetime Value (ingreso total durante la vida del cliente)
    const ltv = ticketPromedio * recurrenciaCompra * lifeTime;
    
    // LIFV - Lifetime Financial Value (valor financiero durante la vida del cliente)
    const lifv = ltv * (margenBruto / 100);
    
    // CAC Payback Period - Meses para recuperar el costo de adquisición
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
  
  // Guardar métricas en Firestore
  async guardarMetricas(userEmail, valores) {
    try {
      // Calcular las métricas
      const metricas = await this.calcularMetricas(valores);
      
      // Crear un objeto con la fecha actual para organizar las métricas diarias
      const hoy = new Date();
      const fechaStr = hoy.toISOString().split('T')[0]; // formato YYYY-MM-DD
      const mes = fechaStr.substring(0, 7); // formato YYYY-MM
      const anio = fechaStr.substring(0, 4); // formato YYYY
      
      // Crear referencias para los documentos de métricas
      const docRefDiario = doc(db, `metricas/financieras/diarias/${fechaStr}`);
      const docRefMensual = doc(db, `metricas/financieras/mensuales/${mes}`);
      const docRefAnual = doc(db, `metricas/financieras/anuales/${anio}`);
      
      // Guardar métricas en las tres dimensiones temporales
      await Promise.all([
        // Métricas diarias
        setDoc(docRefDiario, {
          ...metricas,
          usuarioEmail: userEmail,
        }, { merge: true }),
        
        // Métricas mensuales (actualizamos solo si no existen)
        setDoc(docRefMensual, {
          ...metricas,
          usuarioEmail: userEmail,
        }, { merge: true }),
        
        // Métricas anuales (actualizamos solo si no existen)
        setDoc(docRefAnual, {
          ...metricas,
          usuarioEmail: userEmail,
        }, { merge: true })
      ]);
      
      // Guardar también en historial
      await addDoc(collection(db, 'metricas/financieras/historial'), {
        ...metricas,
        usuarioEmail: userEmail,
        fecha: new Date().toISOString(),
      });
      
      console.log('Métricas guardadas correctamente');
      return metricas;
    } catch (error) {
      console.error('Error guardando métricas:', error);
      throw error;
    }
  }
  
  // Obtener las últimas métricas calculadas
  async obtenerUltimasMetricas(userEmail) {
    try {
      // Obtener la fecha actual para buscar métricas diarias
      const hoy = new Date();
      const fechaStr = hoy.toISOString().split('T')[0];
      
      // Intentar obtener métricas diarias primero
      const docRefDiario = doc(db, `metricas/financieras/diarias/${fechaStr}`);
      const docSnap = await getDoc(docRefDiario);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      // Si no hay métricas diarias, intentar obtener las últimas del historial
      const q = query(
        collection(db, 'metricas/financieras/historial'),
        where('usuarioEmail', '==', userEmail),
        orderBy('fecha', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
      
      // Si no hay métricas, devolver null
      return null;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      return null;
    }
  }
  
  // Obtener historial de métricas
  async obtenerHistorialMetricas(userEmail, periodo = 'diarias', limite = 30) {
    try {
      const q = query(
        collection(db, `metricas/financieras/${periodo}`),
        where('usuarioEmail', '==', userEmail),
        orderBy('fechaCalculo', 'desc'),
        limit(limite)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error obteniendo historial de métricas ${periodo}:`, error);
      return [];
    }
  }
}

export const metricasService = new MetricasService(); 