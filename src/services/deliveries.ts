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
import { Delivery } from '../types';

const COLLECTION_NAME = 'deliveries';

export const deliveriesService = {
  async createDelivery(delivery: Omit<Delivery, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...delivery,
        date: Timestamp.fromDate(delivery.date),
      });
      return { id: docRef.id, ...delivery };
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw error;
    }
  },

  async updateDelivery(id: string, delivery: Partial<Delivery>) {
    try {
      const deliveryRef = doc(db, COLLECTION_NAME, id);
      if (delivery.date) {
        delivery.date = Timestamp.fromDate(delivery.date as Date);
      }
      await updateDoc(deliveryRef, delivery);
      return { id, ...delivery };
    } catch (error) {
      console.error('Error updating delivery:', error);
      throw error;
    }
  },

  async deleteDelivery(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return id;
    } catch (error) {
      console.error('Error deleting delivery:', error);
      throw error;
    }
  },

  async getDeliveries() {
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
      })) as Delivery[];
    } catch (error) {
      console.error('Error getting deliveries:', error);
      throw error;
    }
  },

  async getDeliveriesByArea(area: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('area', '==', area),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Delivery[];
    } catch (error) {
      console.error('Error getting deliveries by area:', error);
      throw error;
    }
  },

  async getDeliveriesBySale(saleId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('saleId', '==', saleId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Delivery[];
    } catch (error) {
      console.error('Error getting deliveries by sale:', error);
      throw error;
    }
  },

  async getDeliveryMetrics() {
    try {
      const deliveries = await this.getDeliveries();
      const areas = [...new Set(deliveries.map(d => d.area))];
      
      const deliveriesPerArea = areas.reduce((acc, area) => {
        acc[area] = deliveries.filter(d => d.area === area).length;
        return acc;
      }, {} as Record<string, number>);

      const totalAmount = deliveries.reduce((sum, d) => sum + d.amount, 0);
      const averageAmount = deliveries.length > 0 ? totalAmount / deliveries.length : 0;

      return {
        totalDeliveries: deliveries.length,
        averageAmount,
        areasServed: areas.length,
        deliveriesPerArea,
      };
    } catch (error) {
      console.error('Error getting delivery metrics:', error);
      throw error;
    }
  },
}; 