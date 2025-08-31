
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
    
    // Superadmins have access to everything
    if (user.rol === 'superadmin') {
      return;
    }

    // Check for specific permission
    const hasPermission = user.permissions?.[requiredPermission];

    if (!hasPermission) {
      router.replace('/admin/access-denied');
    }

  }, [user, loading, router, requiredPermission]);

  return { user, loading };
};

export default useAdminAuth;
