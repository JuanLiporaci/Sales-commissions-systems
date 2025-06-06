import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// Cache para almacenar resultados de consultas
const cache = new Map();

class FirestoreService {
  constructor() {
    this.clearCache = this.clearCache.bind(this);
    this.getCollection = this.getCollection.bind(this);
    
    // Limpiar cache cada 5 minutos
    setInterval(this.clearCache, 5 * 60 * 1000);
  }

  // Limpiar toda la cache o una clave específica
  clearCache(key = null) {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
    console.log('Cache limpiada:', key || 'toda');
    return true;
  }

  // Obtener datos de una colección con filtros opcionales y caché
  async getCollection(collectionName, constraints = [], options = {}) {
    const { cacheKey, cacheTime = 60 * 1000, forceRefresh = false } = options;
    
    try {
      // Si hay una clave de caché y no se fuerza actualización, intentar recuperar de caché
      if (cacheKey && !forceRefresh) {
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < cacheTime) {
          console.log(`Recuperando datos desde caché: ${cacheKey}`);
          return cached.data;
        }
      }
      
      // Construir consulta
      let collectionRef = collection(db, collectionName);
      let queryRef = collectionRef;
      
      if (constraints && constraints.length > 0) {
        queryRef = query(collectionRef, ...constraints);
      }
      
      // Ejecutar consulta
      console.log(`Ejecutando consulta en Firestore: ${collectionName}`);
      const querySnapshot = await getDocs(queryRef);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Guardar en caché si hay clave
      if (cacheKey) {
        cache.set(cacheKey, {
          data: documents,
          timestamp: Date.now()
        });
        console.log(`Datos guardados en caché: ${cacheKey}`);
      }
      
      return documents;
    } catch (error) {
      console.error(`Error obteniendo colección ${collectionName}:`, error);
      throw error;
    }
  }

  // Método para obtener ventas con manejo especial para fechas y campos numéricos
  async getVentas(userEmail, limitValue = 50) {
    try {
      console.log(`Obteniendo ventas para usuario: ${userEmail}`);
      const ventasRef = collection(db, 'ventas');
      const q = query(
        ventasRef,
        where('usuarioEmail', '==', userEmail),
        orderBy('fechaRegistro', 'desc'),
        limit(limitValue)
      );
      
      const querySnapshot = await getDocs(q);
      const ventas = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convertir fechas y valores numéricos correctamente
        return {
          ...data,
          id: doc.id,
          monto: typeof data.monto === 'string' ? parseFloat(data.monto) : (data.monto || 0),
          comision: typeof data.comision === 'string' ? parseFloat(data.comision) : (data.comision || 0),
          fechaRegistro: data.fechaRegistro?.toDate?.() || new Date(data.fechaRegistro)
        };
      });
      
      // Guardar en localStorage como respaldo
      localStorage.setItem(`ventas_${userEmail}`, JSON.stringify(ventas));
      console.log(`Se obtuvieron ${ventas.length} ventas para ${userEmail}`);
      
      return ventas;
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      
      // Si hay error, intentar recuperar del localStorage
      const localVentas = localStorage.getItem(`ventas_${userEmail}`);
      if (localVentas) {
        try {
          const parsed = JSON.parse(localVentas);
          console.log('Usando ventas de localStorage como respaldo');
          return parsed;
        } catch (e) {
          console.error('Error al parsear ventas de localStorage:', e);
        }
      }
      
      return [];
    }
  }

  // Otros métodos: documentos individuales, actualización, etc.
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        console.log(`Documento ${docId} no encontrado en ${collectionName}`);
        return null;
      }
    } catch (error) {
      console.error(`Error obteniendo documento ${docId} de ${collectionName}:`, error);
      throw error;
    }
  }
  
  async setDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data);
      return docId;
    } catch (error) {
      console.error(`Error guardando documento ${docId} en ${collectionName}:`, error);
      throw error;
    }
  }
  
  async addDocument(collectionName, data) {
    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, data);
      return docRef.id;
    } catch (error) {
      console.error(`Error añadiendo documento a ${collectionName}:`, error);
      throw error;
    }
  }
  
  async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data);
      return docId;
    } catch (error) {
      console.error(`Error actualizando documento ${docId} en ${collectionName}:`, error);
      throw error;
    }
  }
  
  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error eliminando documento ${docId} de ${collectionName}:`, error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService(); 