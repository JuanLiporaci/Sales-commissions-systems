import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
const auth = getAuth(app);
// Set persistence to session only
setPersistence(auth, browserSessionPersistence);
const db = getFirestore(app);

export { app, auth, db }; 