

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Admin, Customer } from '@/lib/types';


export type AuthUser = User & Admin & Customer;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleBeforeUnload = () => {
        if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            // Attempt to determine if it's an admin or customer to set the correct doc path
            // This is a simplification; a more robust system might know the user's role
            const adminRef = doc(db, 'admin', userId);
            const customerRef = doc(db, 'customers', userId);
            
            // Try to update both, one will fail silently if the doc doesn't exist
            updateDoc(adminRef, { isOnline: false }).catch(() => {});
            updateDoc(customerRef, { isOnline: false }).catch(() => {});
        }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      const adminDocRef = doc(db, 'admin', currentUser.uid);
      const customerDocRef = doc(db, 'customers', currentUser.uid);

      try {
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists()) {
            await updateDoc(adminDocRef, { isOnline: true });
            const data = adminDoc.data() as Admin;
            setUser({ ...currentUser, ...data, isOnline: true } as AuthUser);
        } else {
            const customerDoc = await getDoc(customerDocRef);
            if (customerDoc.exists()) {
                await updateDoc(customerDocRef, { isOnline: true });
                const data = customerDoc.data() as Customer;
                setUser({ ...currentUser, ...data, isOnline: true } as AuthUser);
            } else {
                setUser(null); 
                auth.signOut();
            }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
        auth.signOut();
      } finally {
        setLoading(false);
      }
    });

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        unsubscribeAuth();
    }
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
