import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase.ts';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Inicializando AuthContext, verificando autenticación...');
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('Estado de autenticación cambiado:', currentUser ? 'Usuario autenticado' : 'No autenticado');
      if (!currentUser) {
        try {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser.email) {
              setUser({
                email: parsedUser.email,
                displayName: parsedUser.displayName || null,
                uid: parsedUser.uid || 'local-user',
                ...parsedUser
              } as unknown as User);
            }
          }
        } catch (error) {
          console.error('Error al recuperar usuario de localStorage:', error);
        }
      } else {
        // Consultar Firestore para saber si es admin
        let admin = false;
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
          if (userDoc.exists()) {
            admin = !!userDoc.data().admin;
          }
        } catch (error) {
          console.error('Error consultando admin en Firestore:', error);
        }
        // Guardar en localStorage
        try {
          const userToSave = {
            email: currentUser.email,
            displayName: currentUser.displayName,
            uid: currentUser.uid,
            admin,
          };
          localStorage.setItem('user', JSON.stringify(userToSave));
          console.log('Usuario guardado en localStorage:', currentUser.email, 'admin:', admin);
        } catch (error) {
          console.error('Error al guardar usuario en localStorage:', error);
        }
        setUser({ ...currentUser, admin } as User & { admin: boolean });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    setUser,
    setLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};