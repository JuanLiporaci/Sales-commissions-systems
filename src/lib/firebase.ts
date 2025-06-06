import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { CacheConfig, PerformanceConfig } from './config';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDsZ6BR_UGviRPe7Qqx2NfIMYRzdxtcWHk",
  authDomain: "scsf-32dcf.firebaseapp.com",
  projectId: "scsf-32dcf",
  storageBucket: "scsf-32dcf.firebasestorage.app",
  messagingSenderId: "1025527873230",
  appId: "1:1025527873230:web:403d2e8e4b798a6d741a9f",
  measurementId: "G-JMZZSNGZ9H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
auth.useDeviceLanguage();

// Initialize Firestore with persistence
const db = getFirestore(app);

// Habilitar persistencia para reducir lecturas de Firestore
if (PerformanceConfig.ENABLE_FIRESTORE_PERSISTENCE) {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('Firestore persistence enabled');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
      } else {
        console.error('Error enabling Firebase persistence:', err);
      }
    });
}

export { app, auth, db }; 