
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ShoppingCart, Package, LogOut, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const profileNavLinks = [
  { href: '/profile', label: 'Mi Perfil', icon: User },
  { href: '/profile/orders', label: 'Mis Pedidos', icon: Package },
  { href: '/profile/cart', label: 'Carrito', icon: ShoppingCart },
  { href: '/profile/checkout', label: 'Pagar', icon: CreditCard },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if the user is an admin. If so, redirect to the admin panel.
    const checkUserRole = async () => {
      setIsCheckingRole(true);
      const adminDocRef = doc(db, 'admin', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      if (adminDoc.exists()) {
        toast({
          title: 'Redireccionando...',
          description: 'Los administradores no tienen perfil de cliente.',
        });
        router.replace('/admin');
      } else {
        setIsCheckingRole(false);
      }
    };
    
    checkUserRole();

  }, [user, authLoading, router, toast]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  if (authLoading || isCheckingRole) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <nav className="flex flex-col gap-2 p-4 border rounded-lg bg-card">
            {profileNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  {
                    'bg-primary/10 text-primary font-semibold': pathname === link.href,
                    'hidden': link.href === '/profile/checkout' && !pathname.startsWith('/profile/checkout')
                  }
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
            </Button>
          </nav>
        </aside>
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
