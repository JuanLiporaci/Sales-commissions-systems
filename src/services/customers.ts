import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types';

const COLLECTION_NAME = 'customers';

export const customersService = {
  async createCustomer(customer: Omit<Customer, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), customer);
      return { id: docRef.id, ...customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  async updateCustomer(id: string, customer: Partial<Customer>) {
    try {
      const customerRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(customerRef, customer);
      return { id, ...customer };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  async deleteCustomer(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return id;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  async getCustomers() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  },

  async getCustomerById(id: string) {
    try {
      const customerRef = doc(db, COLLECTION_NAME, id);
      const customerDoc = await getDoc(customerRef);
      if (!customerDoc.exists()) {
        throw new Error('Customer not found');
      }
      return {
        id: customerDoc.id,
        ...customerDoc.data(),
      } as Customer;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  },

  async getCustomersByCredit(minCredit: number) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('currentCredit', '>=', minCredit),
        orderBy('currentCredit', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers by credit:', error);
      throw error;
    }
  },
}; 