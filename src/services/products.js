import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const productsService = {
  async getAllProducts() {
    const snapshot = await getDocs(collection(db, 'productos'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}; 