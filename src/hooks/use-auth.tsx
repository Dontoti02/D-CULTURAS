
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
        // Listener unificado para ambas colecciones
        let unsubscribeSnapshot: () => void;

        const setupListener = (collectionName: string, isPrimary = true) => {
            const docRef = doc(db, collectionName, currentUser.uid);
            return onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const [firstName, ...lastNameParts] = (data.name || '').split(' ');
                    setUser({
                        ...currentUser,
                        ...data,
                        firstName: data.firstName || firstName,
                        lastName: data.lastName || lastNameParts.join(' '),
                        photoURL: data.photoURL || currentUser.photoURL,
                    });
                     // Si se encuentra, no es necesario seguir buscando
                    if (unsubscribeSnapshot && collectionName === 'admins') {
                       // Si encontramos un admin, no necesitamos seguir escuchando al cliente
                    }
                } else if (isPrimary) {
                    // Si no se encuentra en la colección primaria (customers), busca en admins
                    unsubscribeSnapshot = setupListener('admins', false);
                } else {
                    // Si no se encuentra en ninguna, usa solo los datos de Auth
                    setUser(currentUser);
                }
                setLoading(false);
            });
        };

        // Inicia la búsqueda en 'customers'
        unsubscribeSnapshot = setupListener('customers');

        // Retorna la función para dejar de escuchar cuando el componente se desmonte
        return () => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };

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
