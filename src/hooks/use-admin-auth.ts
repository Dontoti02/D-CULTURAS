
'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';
import { AdminPermission } from '@/lib/types';

/**
 * A client-side hook to protect admin routes based on user permissions.
 * It checks if the logged-in user is an admin and has the required permission
 * to view the current route.
 *
 * @param requiredPermission The permission required to access the route.
 */
const useAdminAuth = (requiredPermission: AdminPermission) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for user data to be loaded
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Admins have access to everything
    if (user.rol === 'admin') {
      return;
    }
    
    // If user is not an admin, they are a subadmin. Check permissions.
    // The user object is a mix of Admin and Customer types, so we check for permissions property.
    const hasPermission = user.permissions?.[requiredPermission];

    if (!hasPermission) {
      router.replace('/admin/access-denied');
    }

  }, [user, loading, router, requiredPermission]);

  return { user, loading };
};

export default useAdminAuth;
