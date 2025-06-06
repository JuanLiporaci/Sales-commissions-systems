import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  writeBatch,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

const COLLECTION_NAME = 'delivery_locations';

let _locationsCache = null;
let _locationsCacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const locationsService = {
  async getAllLocations(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && _locationsCache && (now - _locationsCacheTimestamp < CACHE_TTL)) {
      return _locationsCache;
    }
    try {
      console.log(`Obteniendo todas las ubicaciones de ${COLLECTION_NAME}...`);
      const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const locations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Se encontraron ${locations.length} ubicaciones`);
      _locationsCache = locations;
      _locationsCacheTimestamp = now;
      return locations;
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  },
  
  async getLocationById(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  },
  
  async createLocation(location) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), location);
      return { id: docRef.id, ...location };
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },
  
  async updateLocation(id, location) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, location);
      return { id, ...location };
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },
  
  async deleteLocation(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return id;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  },
  
  async importLocationsFromData(locations) {
    console.log(`Iniciando importación de ${locations.length} ubicaciones...`);
    
    try {
      // En lugar de usar batch, haremos escrituras individuales con mejor manejo de errores
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      // Primero eliminamos todas las ubicaciones existentes
      console.log("Eliminando ubicaciones existentes...");
      try {
        const existingLocations = await this.getAllLocations();
        if (existingLocations.length > 0) {
          console.log(`Eliminando ${existingLocations.length} ubicaciones existentes`);
          
          // Usar método directo de eliminación para evitar problemas con batch
          for (const location of existingLocations) {
            try {
              await deleteDoc(doc(db, COLLECTION_NAME, location.id));
              successCount++;
            } catch (deleteErr) {
              console.error(`Error eliminando ubicación ${location.id}:`, deleteErr);
              errorCount++;
            }
          }
        } else {
          console.log("No hay ubicaciones existentes para eliminar");
        }
      } catch (getErr) {
        console.error("Error obteniendo ubicaciones existentes:", getErr);
        // Continuamos de todas formas para intentar importar las nuevas
      }
      
      // Ahora agregamos las nuevas ubicaciones
      console.log(`Agregando ${locations.length} nuevas ubicaciones...`);
      for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        try {
          // Usamos setDoc con un ID generado para mayor control
          const newDocRef = doc(collection(db, COLLECTION_NAME));
          await setDoc(newDocRef, {
            ...location,
            importedAt: new Date().toISOString()
          });
          
          results.push({
            id: newDocRef.id,
            ...location
          });
          
          successCount++;
        } catch (addErr) {
          console.error(`Error agregando ubicación ${i}:`, addErr);
          errorCount++;
        }
      }
      
      console.log(`Importación completada: ${successCount} exitosas, ${errorCount} errores`);
      return results;
    } catch (error) {
      console.error('Error en importación de ubicaciones:', error);
      throw error;
    }
  },
  
  // Método alternativo usando documentos individuales en lugar de batch
  async importLocationsDirectly(locations) {
    console.log(`Importando ${locations.length} ubicaciones directamente...`);
    
    try {
      // Eliminar ubicaciones existentes primero
      const existingLocations = await this.getAllLocations();
      console.log(`Eliminando ${existingLocations.length} ubicaciones existentes`);
      
      for (const location of existingLocations) {
        await deleteDoc(doc(db, COLLECTION_NAME, location.id));
      }
      
      // Agregar nuevas ubicaciones
      const results = [];
      
      for (const location of locations) {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...location,
          importedAt: new Date().toISOString()
        });
        
        results.push({
          id: docRef.id,
          ...location
        });
      }
      
      console.log(`Se importaron ${results.length} ubicaciones exitosamente`);
      return results;
    } catch (error) {
      console.error('Error importing locations directly:', error);
      throw error;
    }
  }
};

export function clearLocationsCache() {
  _locationsCache = null;
  _locationsCacheTimestamp = null;
} 