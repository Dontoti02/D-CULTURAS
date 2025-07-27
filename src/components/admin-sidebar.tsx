
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
  Shield,
  Loader2,
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
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
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
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Clientes', icon: Users, disabled: true },
];

const adminLinks = [
    { href: '/admin/admins', label: 'Ver Todos', disabled: true },
    { href: '/admin/admins/new', label: 'Agregar Nuevo', disabled: false },
]

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
                setAdminData({
                    firstName: 'Admin',
                    lastName: '',
                    photoURL: '',
                    email: user.email || 'No email',
                });
            }
        } else {
            setAdminData(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };


  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col">
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
          <span className="font-bold">stylesUP!</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 flex-grow">
        {navLinks.map((link) =>
          link.subItems ? (
            <Collapsible
              key={link.href}
              defaultOpen={pathname.startsWith(link.href)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 text-muted-foreground"
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
                          'pointer-events-none opacity-50': subItem.disabled,
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                {
                  'bg-primary/10 text-primary': pathname === link.href,
                  'pointer-events-none opacity-50': link.disabled,
                }
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        )}
         <Collapsible defaultOpen={pathname.startsWith('/admin/admins')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-3 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Administradores
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-8 pt-1">
                  {adminLinks.map(subItem => (
                     <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm',
                          {
                            'text-primary': pathname === subItem.href,
                            'pointer-events-none opacity-50': subItem.disabled,
                          }
                        )}
                      >
                       {subItem.label}
                     </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
      </nav>

      <div className="mt-auto flex flex-col gap-2">
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
                     <AvatarImage src={adminData.photoURL} alt="Foto de perfil" />
                     <AvatarFallback>{adminData.firstName.charAt(0)}{adminData.lastName.charAt(0)}</AvatarFallback>
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
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Facturación</span>
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
