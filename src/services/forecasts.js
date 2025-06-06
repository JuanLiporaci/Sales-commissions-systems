import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';

export const forecastsService = {
  async getAllForecasts(usuarioEmail = null) {
    let q = query(collection(db, 'forecasts'), orderBy('fechaRegistro', 'desc'));
    if (usuarioEmail) {
      q = query(collection(db, 'forecasts'), where('usuarioEmail', '==', usuarioEmail), orderBy('fechaRegistro', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  async marcarForecastCumplido(forecastId) {
    try {
      console.log(`Marcando forecast ${forecastId} como cumplido`);
      const forecastRef = doc(db, 'forecasts', forecastId);
      
      await updateDoc(forecastRef, {
        cumplido: true
      });
      
      console.log(`Forecast ${forecastId} marcado como cumplido correctamente`);
      return true;
    } catch (error) {
      console.error(`Error al marcar forecast ${forecastId} como cumplido:`, error);
      return false;
    }
  }
}; 