import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '../services/auth';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { firestoreService } from './FirestoreService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

// Clave para almacenar el estado de autenticación en localStorage
const AUTH_CACHE_KEY = 'auth_user_cache';
const AUTH_CACHE_EXPIRY = 'auth_cache_expiry';
const AUTH_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos (antes 1 hora)
const AUTH_LAST_CHECK = 'auth_last_check';
const CHECK_INTERVAL = 30 * 60 * 1000; // Verificar con Firebase cada 30 minutos

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authListener, setAuthListener] = useState<(() => void) | null>(null);
  const [dataPreloaded, setDataPreloaded] = useState(false);

  // Función para guardar el usuario en caché
  const cacheUser = (user: User | null) => {
    if (user) {
      // Solo guardamos propiedades seguras en localStorage, no credenciales
      const cacheData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + AUTH_CACHE_TTL).toString());
      localStorage.setItem(AUTH_LAST_CHECK, Date.now().toString());
    } else {
      // Si no hay usuario, limpiamos la caché
      localStorage.removeItem(AUTH_CACHE_KEY);
      localStorage.removeItem(AUTH_CACHE_EXPIRY);
      localStorage.removeItem(AUTH_LAST_CHECK);
    }
  };

  // Función para cargar usuario desde caché
  const loadCachedUser = () => {
    const cachedUser = localStorage.getItem(AUTH_CACHE_KEY);
    const expiry = localStorage.getItem(AUTH_CACHE_EXPIRY);
    
    if (cachedUser && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (expiryTime > Date.now()) {
        return JSON.parse(cachedUser);
      } else {
        // Caché expirada
        localStorage.removeItem(AUTH_CACHE_KEY);
        localStorage.removeItem(AUTH_CACHE_EXPIRY);
        localStorage.removeItem(AUTH_LAST_CHECK);
      }
    }
    return null;
  };

  // Función para verificar si debemos consultar a Firebase Auth
  const shouldCheckWithFirebase = () => {
    const lastCheck = localStorage.getItem(AUTH_LAST_CHECK);
    if (!lastCheck) return true;
    
    const lastCheckTime = parseInt(lastCheck, 10);
    return (Date.now() - lastCheckTime) > CHECK_INTERVAL;
  };

  // Precargar datos para reducir consultas a Firebase
  const preloadUserData = async (userEmail: string) => {
    if (!userEmail || dataPreloaded) return;
    
    try {
      console.log('Precargando datos para usuario:', userEmail);
      await firestoreService.preloadUserData(userEmail);
      setDataPreloaded(true);
      console.log('Datos precargados con éxito para:', userEmail);
    } catch (error) {
      console.error('Error al precargar datos:', error);
    }
  };

  useEffect(() => {
    // Intentar cargar usuario desde caché primero
    const cachedUser = loadCachedUser();
    if (cachedUser) {
      console.log('Usando usuario en caché:', cachedUser.email);
      setUser(cachedUser as User);
      setLoading(false);
      
      // Precargar datos del usuario desde caché
      if (cachedUser.email) {
        preloadUserData(cachedUser.email);
      }
      
      // Solo verificamos con Firebase si ha pasado el intervalo de tiempo
      if (shouldCheckWithFirebase()) {
        console.log('Verificando con Firebase Auth después del intervalo...');
        startAuthListener();
      }
    } else {
      // Si no hay caché, verificamos con Firebase
      startAuthListener();
    }

    return () => {
      // Limpieza al desmontar
      if (authListener) {
        authListener();
      }
    };
  }, []);

  // Efecto para precargar datos cuando cambia el usuario
  useEffect(() => {
    if (user?.email) {
      preloadUserData(user.email);
    } else {
      setDataPreloaded(false); // Resetear cuando el usuario cambia o cierra sesión
    }
  }, [user?.email]);

  // Función para iniciar el listener de autenticación
  const startAuthListener = () => {
    if (authListener) {
      // Si ya existe un listener, lo eliminamos primero
      authListener();
    }
    
    const unsubscribe = onAuthStateChange((authUser) => {
      console.log('Auth state changed:', authUser ? `User logged in: ${authUser.email}` : 'No user');
      
      // Actualizar el estado y la caché
      setUser(authUser);
      cacheUser(authUser);
      setLoading(false);
      
      // Resetear el estado de precarga al cambiar usuario
      setDataPreloaded(false);
    });
    
    setAuthListener(() => unsubscribe);
    return unsubscribe;
  };

  if (loading && !loadCachedUser()) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Cargando...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 