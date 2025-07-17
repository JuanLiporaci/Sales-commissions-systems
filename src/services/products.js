import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { quickBooksService } from './quickbooks.js';

export const productsService = {
  /**
   * Get all products from Firestore
   * @returns {Promise<Array>} Array of products
   */
  async getAllProducts() {
    try {
      const snapshot = await getDocs(collection(db, 'productos'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting products from Firestore:', error);
      throw error;
    }
  },

  /**
   * Get products from QuickBooks and sync with Firestore
   * @returns {Promise<Array>} Array of products
   */
  async syncProductsFromQuickBooks() {
    try {
      if (!quickBooksService.isAuthenticated()) {
        throw new Error('QuickBooks no está autenticado. Debe autorizar la aplicación primero.');
      }

      console.log('Sincronizando productos desde QuickBooks...');
      
      // Get products from QuickBooks
      const qbProducts = await quickBooksService.importProducts();
      
      // Get existing products from Firestore
      const existingProducts = await this.getAllProducts();
      const existingQbIds = new Set(existingProducts.map(p => p.qbProductId).filter(Boolean));
      
      const productsToAdd = [];
      const productsToUpdate = [];
      
      for (const qbProduct of qbProducts) {
        if (existingQbIds.has(qbProduct.qbProductId)) {
          // Update existing product
          const existingProduct = existingProducts.find(p => p.qbProductId === qbProduct.qbProductId);
          if (existingProduct) {
            productsToUpdate.push({
              id: existingProduct.id,
              ...qbProduct,
              updatedAt: new Date().toISOString()
            });
          }
        } else {
          // Add new product
          productsToAdd.push({
            ...qbProduct,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // Add new products to Firestore
      for (const product of productsToAdd) {
        await addDoc(collection(db, 'productos'), product);
      }
      
      // Update existing products in Firestore
      for (const product of productsToUpdate) {
        const { id, ...productData } = product;
        await updateDoc(doc(db, 'productos', id), productData);
      }
      
      console.log(`Sincronización completada: ${productsToAdd.length} productos nuevos, ${productsToUpdate.length} productos actualizados`);
      
      return await this.getAllProducts();
    } catch (error) {
      console.error('Error syncing products from QuickBooks:', error);
      throw error;
    }
  },

  /**
   * Get pricing information from QuickBooks
   * @returns {Promise<Array>} Array of pricing data
   */
  async getPricingFromQuickBooks() {
    try {
      if (!quickBooksService.isAuthenticated()) {
        throw new Error('QuickBooks no está autenticado. Debe autorizar la aplicación primero.');
      }

      return await quickBooksService.importPricing();
    } catch (error) {
      console.error('Error getting pricing from QuickBooks:', error);
      throw error;
    }
  },

  /**
   * Create a new product in Firestore
   * @param {Object} product - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(product) {
    try {
      const docRef = await addDoc(collection(db, 'productos'), {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...product };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Update a product in Firestore
   * @param {string} id - Product ID
   * @param {Object} product - Product data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(id, product) {
    try {
      await updateDoc(doc(db, 'productos', id), {
        ...product,
        updatedAt: new Date().toISOString()
      });
      return { id, ...product };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Delete a product from Firestore
   * @param {string} id - Product ID
   * @returns {Promise<string>} Deleted product ID
   */
  async deleteProduct(id) {
    try {
      await deleteDoc(doc(db, 'productos', id));
      return id;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Get products by type
   * @param {string} type - Product type
   * @returns {Promise<Array>} Array of products
   */
  async getProductsByType(type) {
    try {
      const q = query(
        collection(db, 'productos'),
        where('type', '==', type),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting products by type:', error);
      throw error;
    }
  },

  /**
   * Get active products
   * @returns {Promise<Array>} Array of active products
   */
  async getActiveProducts() {
    try {
      const q = query(
        collection(db, 'productos'),
        where('active', '==', true),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active products:', error);
      throw error;
    }
  },

  /**
   * Search products by name or SKU
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching products
   */
  async searchProducts(searchTerm) {
    try {
      const allProducts = await this.getAllProducts();
      const term = searchTerm.toLowerCase();
      
      return allProducts.filter(product => 
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
}; 