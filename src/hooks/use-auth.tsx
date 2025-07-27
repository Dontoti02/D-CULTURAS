
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

// Combina el tipo de usuario de Firebase Auth con los campos personalizados de Firestore
export type AuthUser = User & {
  firstName?: string;
  lastName?: string;
  photoURL?: string; // photoURL de Firestore tiene prioridad
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Si hay un usuario, escucha cambios en su documento de Firestore
        const customerDocRef = doc(db, 'customers', currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(customerDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const customerData = docSnap.data();
            // Combina los datos de Auth y Firestore
            setUser({
              ...currentUser,
              ...customerData,
              // Asegura que la photoURL de Firestore (la más actualizada) tenga prioridad
              photoURL: customerData.photoURL || currentUser.photoURL,
            });
          } else {
             // Si no hay datos en Firestore, usa solo los de Auth
            setUser(currentUser);
          }
          setLoading(false);
        });
        
        // Retorna la función para dejar de escuchar cuando el componente se desmonte
        return () => unsubscribeSnapshot();
      } else {
        // No hay usuario logueado
        setUser(null);
        setLoading(false);
      }
    });

    // Retorna la función para dejar de escuchar los cambios de autenticación
    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen w-full">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
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
