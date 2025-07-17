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
import { quickBooksService } from './quickbooks.js';

const COLLECTION_NAME = 'customers';

export const customersService = {
  /**
   * Create a new customer
   * @param customer - Customer data
   * @returns Created customer
   */
  async createCustomer(customer: Omit<Customer, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), customer);
      return { id: docRef.id, ...customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  /**
   * Update an existing customer
   * @param id - Customer ID
   * @param customer - Customer data to update
   * @returns Updated customer
   */
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

  /**
   * Delete a customer
   * @param id - Customer ID
   * @returns Deleted customer ID
   */
  async deleteCustomer(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return id;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  /**
   * Get all customers from Firestore
   * @returns Array of customers
   */
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

  /**
   * Get a customer by ID
   * @param id - Customer ID
   * @returns Customer data
   */
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

  /**
   * Get customers by credit limit
   * @param minCredit - Minimum credit amount
   * @returns Array of customers
   */
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

  /**
   * Sync customers from QuickBooks to Firestore
   * @returns Array of synced customers
   */
  async syncCustomersFromQuickBooks() {
    try {
      if (!quickBooksService.isAuthenticated()) {
        throw new Error('QuickBooks no está autenticado. Debe autorizar la aplicación primero.');
      }

      console.log('Sincronizando clientes desde QuickBooks...');
      
      // Get customers from QuickBooks
      const qbCustomers = await quickBooksService.importCustomersAsLocations();
      
      // Get existing customers from Firestore
      const existingCustomers = await this.getCustomers();
      const existingQbIds = new Set(existingCustomers.map(c => c.qbCustomerId).filter(Boolean));
      
      const customersToAdd = [];
      const customersToUpdate = [];
      
      for (const qbCustomer of qbCustomers) {
        if (existingQbIds.has(qbCustomer.qbCustomerId)) {
          // Update existing customer
          const existingCustomer = existingCustomers.find(c => c.qbCustomerId === qbCustomer.qbCustomerId);
          if (existingCustomer) {
            customersToUpdate.push({
              id: existingCustomer.id,
              ...qbCustomer,
              updatedAt: new Date().toISOString()
            });
          }
        } else {
          // Add new customer
          customersToAdd.push({
            ...qbCustomer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // Add new customers to Firestore
      for (const customer of customersToAdd) {
        await addDoc(collection(db, COLLECTION_NAME), customer as Omit<Customer, 'id'>);
      }
      
      // Update existing customers in Firestore
      for (const customer of customersToUpdate) {
        const { id, ...customerData } = customer;
        await updateDoc(doc(db, COLLECTION_NAME, id), customerData as Partial<Customer>);
      }
      
      console.log(`Sincronización completada: ${customersToAdd.length} clientes nuevos, ${customersToUpdate.length} clientes actualizados`);
      
      return await this.getCustomers();
    } catch (error) {
      console.error('Error syncing customers from QuickBooks:', error);
      throw error;
    }
  },

  /**
   * Get customer addresses from QuickBooks
   * @returns Array of customer addresses
   */
  async getCustomerAddressesFromQuickBooks() {
    try {
      if (!quickBooksService.isAuthenticated()) {
        throw new Error('QuickBooks no está autenticado. Debe autorizar la aplicación primero.');
      }

      return await quickBooksService.importCustomersAsLocations();
    } catch (error) {
      console.error('Error getting customer addresses from QuickBooks:', error);
      throw error;
    }
  },

  /**
   * Search customers by name or email
   * @param searchTerm - Search term
   * @returns Array of matching customers
   */
  async searchCustomers(searchTerm: string) {
    try {
      const allCustomers = await this.getCustomers();
      const term = searchTerm.toLowerCase();
      
      return allCustomers.filter(customer => 
        customer.name?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.contactName?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  },

  /**
   * Get customers by city
   * @param city - City name
   * @returns Array of customers in the city
   */
  async getCustomersByCity(city: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('city', '==', city),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers by city:', error);
      throw error;
    }
  },

  /**
   * Get customers by state
   * @param state - State name
   * @returns Array of customers in the state
   */
  async getCustomersByState(state: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('state', '==', state),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
    } catch (error) {
      console.error('Error getting customers by state:', error);
      throw error;
    }
  }
}; 