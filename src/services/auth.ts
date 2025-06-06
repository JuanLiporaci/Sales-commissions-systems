import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, db } from '../lib/firebase.ts';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const clearAuthState = async () => {
  try {
    // Force sign out
    await signOut(auth);
    // Clear any remaining auth state
    await auth.signOut();
    // Set persistence to session only
    await setPersistence(auth, browserSessionPersistence);
    // Clear any remaining tokens
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const register = async (email: string, password: string, fullName: string) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: fullName });

    // Guardar usuario en Firestore
    const userRef = doc(db, 'usuarios', String(user.uid));
    await setDoc(userRef, {
      email: String(user.email ?? ''),
      displayName: fullName,
      photoURL: user.photoURL || '',
      creado: new Date().toISOString()
    }, { merge: true });

    return user;
  } catch (error: any) {
    let message = 'An error occurred during registration';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'Email/password accounts are not enabled';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      default:
        message = error.message;
    }
    
    throw new Error(message);
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // Guardar/actualizar usuario en Firestore
    const userRef = doc(db, 'usuarios', user.uid);
    // Intentar obtener identificador personalizado de localStorage (si existe)
    let identificador = '';
    try {
      const localUser = JSON.parse(localStorage.getItem('user'));
      if (localUser && localUser.identificador) identificador = localUser.identificador;
    } catch {}
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      identificador: identificador || '',
      actualizado: new Date().toISOString()
    }, { merge: true });
    // Leer el perfil actualizado y guardarlo en localStorage
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        identificador: userSnap.data().identificador || '',
      }));
    }
    return user;
  } catch (error: any) {
    let message = 'Failed to sign in with Google';
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        message = 'Sign in was cancelled';
        break;
      case 'auth/popup-blocked':
        message = 'Pop-up was blocked by the browser';
        break;
      default:
        message = error.message;
    }
    
    throw new Error(message);
  }
};

export const login = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    let message = 'Failed to sign in';
    
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Invalid email or password';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      default:
        message = error.message;
    }
    
    throw new Error(message);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error('Failed to sign out');
  }
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Obtener perfil de usuario desde Firestore
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const userRef = doc(db, 'usuarios', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
}; 