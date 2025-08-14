
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Settings,
  ChevronRight,
  ArrowLeft,
  MoreHorizontal,
  LogOut,
  Award,
  Warehouse,
  Landmark,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

const navLinks = [
  {
    href: '/admin',
    label: 'Panel',
    icon: Home,
  },
  {
    href: '/admin/products',
    label: 'Productos',
    icon: Package,
    subItems: [
      { href: '/admin/products', label: 'Ver Todos' },
      { href: '/admin/products/new', label: 'Agregar Nuevo' },
    ],
  },
  { href: '/admin/inventory', label: 'Inventario', icon: Warehouse },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Clientes', icon: Users },
  { href: '/admin/promotions', label: 'Promociones', icon: Award },
  { href: '/admin/finance', label: 'Finanzas', icon: Landmark },
  { href: '/admin/annual-closing', label: 'Cierre Anual', icon: Archive },
];

interface AdminData {
    firstName: string;
    lastName: string;
    photoURL: string;
    email: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const adminDocRef = doc(db, 'admins', user.uid);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists()) {
                const data = adminDoc.data();
                setAdminData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    photoURL: data.photoURL || '',
                    email: user.email || '',
                });
            } else {
                setAdminData(null);
                // If user is authenticated but not an admin, they shouldn't be here
                router.push('/login');
            }
        } else {
            setAdminData(null);
            router.push('/login');
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };


  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-card p-4 md:flex flex-col">
      <div className="flex items-center gap-2 mb-6 px-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M12 2l-7 5 7 5 7-5-7-5zM2 12l7 5 7-5M2 17l7 5 7-5" />
          </svg>
          <span className="font-bold">StylesUP!</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-2 -mr-2">
        {navLinks.map((link) =>
          link.subItems ? (
            <Collapsible
              key={link.href}
              defaultOpen={pathname.startsWith(link.href)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 font-medium"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-8 pt-1">
                  {link.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm',
                        {
                          'text-primary': pathname === subItem.href,
                        }
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary font-medium',
                {
                  'bg-muted text-primary': pathname.startsWith(link.href) && (link.href !== '/admin' || pathname === '/admin'),
                }
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-4 border-t">
        <Link href="/">
          <Button variant="outline" className="w-full justify-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir a la Tienda
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 h-14"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2 w-full">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
              ) : adminData ? (
                <>
                  <Avatar className="h-8 w-8">
                     {adminData.photoURL && <AvatarImage src={adminData.photoURL} alt="Foto de perfil" />}
                     <AvatarFallback>{adminData.firstName?.charAt(0)}{adminData.lastName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">{`${adminData.firstName} ${adminData.lastName}`}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {adminData.email}
                    </p>
                  </div>
                  <MoreHorizontal className="ml-auto h-4 w-4 flex-shrink-0" />
                </>
              ) : (
                 <div className="text-left">
                    <p className="text-sm font-medium">No autenticado</p>
                 </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            sideOffset={8}
          >
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Ajustes</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Facturación</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
