import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Rep } from '../types';

const COLLECTION_NAME = 'reps';

export const repsService = {
  async createRep(rep: Omit<Rep, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), rep);
      return { id: docRef.id, ...rep };
    } catch (error) {
      console.error('Error creating rep:', error);
      throw error;
    }
  },

  async updateRep(id: string, rep: Partial<Rep>) {
    try {
      const repRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(repRef, rep);
      return { id, ...rep };
    } catch (error) {
      console.error('Error updating rep:', error);
      throw error;
    }
  },

  async deleteRep(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return id;
    } catch (error) {
      console.error('Error deleting rep:', error);
      throw error;
    }
  },

  async getReps() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Rep[];
    } catch (error) {
      console.error('Error getting reps:', error);
      throw error;
    }
  },

  async getRepById(id: string) {
    try {
      const repRef = doc(db, COLLECTION_NAME, id);
      const repDoc = await getDoc(repRef);
      if (!repDoc.exists()) {
        throw new Error('Rep not found');
      }
      return {
        id: repDoc.id,
        ...repDoc.data(),
      } as Rep;
    } catch (error) {
      console.error('Error getting rep:', error);
      throw error;
    }
  },

  async updateRepDailyGain(id: string, amount: number) {
    try {
      const repRef = doc(db, COLLECTION_NAME, id);
      const repDoc = await getDoc(repRef);
      if (!repDoc.exists()) {
        throw new Error('Rep not found');
      }
      
      const currentGain = repDoc.data().dailyGain || 0;
      await updateDoc(repRef, {
        dailyGain: currentGain + amount,
      });

      return {
        id,
        dailyGain: currentGain + amount,
      };
    } catch (error) {
      console.error('Error updating rep daily gain:', error);
      throw error;
    }
  },

  async updateRepCashOut(id: string, amount: number) {
    try {
      const repRef = doc(db, COLLECTION_NAME, id);
      const repDoc = await getDoc(repRef);
      if (!repDoc.exists()) {
        throw new Error('Rep not found');
      }
      
      const currentCashOut = repDoc.data().cashOutAvailable || 0;
      if (amount > currentCashOut) {
        throw new Error('Insufficient funds for cash out');
      }

      await updateDoc(repRef, {
        cashOutAvailable: currentCashOut - amount,
      });

      return {
        id,
        cashOutAvailable: currentCashOut - amount,
      };
    } catch (error) {
      console.error('Error updating rep cash out:', error);
      throw error;
    }
  },
}; 