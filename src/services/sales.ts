import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Sale } from '../types';

const COLLECTION_NAME = 'sales';

export const salesService = {
  async createSale(sale: Omit<Sale, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...sale,
        date: Timestamp.fromDate(sale.date),
      });
      return { id: docRef.id, ...sale };
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  async updateSale(id: string, sale: Partial<Sale>) {
    try {
      const saleRef = doc(db, COLLECTION_NAME, id);
      if (sale.date) {
        sale.date = Timestamp.fromDate(sale.date as Date);
      }
      await updateDoc(saleRef, sale);
      return { id, ...sale };
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  },

  async deleteSale(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return id;
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  },

  async getSales() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Sale[];
    } catch (error) {
      console.error('Error getting sales:', error);
      throw error;
    }
  },

  async getSalesByCustomer(customerId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('customerId', '==', customerId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Sale[];
    } catch (error) {
      console.error('Error getting customer sales:', error);
      throw error;
    }
  },

  async getSalesByType(type: 'COD' | 'CREDIT') {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('type', '==', type),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Sale[];
    } catch (error) {
      console.error('Error getting sales by type:', error);
      throw error;
    }
  },

  async getSalesByUserEmail(usuarioEmail: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('usuarioEmail', '==', usuarioEmail),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Sale[];
    } catch (error) {
      console.error('Error getting sales by user email:', error);
      throw error;
    }
  },

  async marcarVentaComoPagada(idVenta: string) {
    try {
      await updateDoc(doc(db, 'ventas', idVenta), { pago: true });
    } catch (error) {
      console.error('Error marking sale as paid:', error);
      throw error;
    }
  },
}; 