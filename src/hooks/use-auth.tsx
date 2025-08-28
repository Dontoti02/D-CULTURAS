

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
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Try to fetch as an admin first
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminUnsubscribe = onSnapshot(adminDocRef, (adminDoc) => {
            if (adminDoc.exists()) {
                const data = adminDoc.data();
                // Handle 'name' field for admins
                const [firstName, ...lastNameParts] = (data.name || '').split(' ');
                setUser({
                    ...currentUser,
                    ...data,
                    firstName: data.firstName || firstName,
                    lastName: data.lastName || lastNameParts.join(' '),
                    photoURL: data.photoURL || currentUser.photoURL,
                });
                setLoading(false);
            } else {
                // If not an admin, try to fetch as a customer
                const customerDocRef = doc(db, 'customers', currentUser.uid);
                const customerUnsubscribe = onSnapshot(customerDocRef, (customerDoc) => {
                    if (customerDoc.exists()) {
                        const data = customerDoc.data();
                        setUser({
                            ...currentUser,
                            ...data,
                            photoURL: data.photoURL || currentUser.photoURL,
                        });
                    } else {
                        // User exists in Auth, but not in any collection
                        setUser(currentUser);
                    }
                    setLoading(false);
                });
                return () => customerUnsubscribe();
            }
        });
        return () => adminUnsubscribe();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

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
