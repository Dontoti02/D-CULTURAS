
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
  Bot,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';

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
  { href: '/admin/ai-assistant', label: 'Asistente IA', icon: Bot },
];

interface AdminData {
    firstName: string;
    lastName: string;
    photoURL: string;
    email: string;
}

interface AdminSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const adminDocRef = doc(db, 'admin', user.uid);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists()) {
                const data = adminDoc.data();
                const [firstName, ...lastNameParts] = (data.name || '').split(' ');
                setAdminData({
                    firstName: data.firstName || firstName,
                    lastName: data.lastName || lastNameParts.join(' '),
                    photoURL: data.photoURL || '',
                    email: user.email || '',
                });
            } else {
                setAdminData(null);
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

  const handleLinkClick = (href: string) => {
    router.push(href);
    onLinkClick?.();
  };


  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-2 mb-6 px-2">
        <Link href="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
            <Image src="/assets/logo.png" alt="Diseñando Culturas Logo" width={140} height={35} className="h-8 w-auto" />
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
                    <button
                      key={subItem.href}
                      onClick={() => handleLinkClick(subItem.href)}
                      className={cn(
                        'flex w-full text-left items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm',
                        {
                          'text-primary': pathname === subItem.href,
                        }
                      )}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <button
              key={link.href}
              onClick={() => handleLinkClick(link.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary font-medium text-left',
                {
                  'bg-muted text-primary': pathname.startsWith(link.href) && (link.href !== '/admin' || pathname === '/admin'),
                }
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </button>
          )
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-4 border-t">
        <Button variant="outline" className="w-full justify-start" onClick={() => handleLinkClick('/')}>

            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir a la Tienda
        </Button>
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
              <button className="w-full" onClick={() => handleLinkClick('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Ajustes</span>
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button className="w-full" onClick={() => handleLinkClick('/admin/billing')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Facturación</span>
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}


export default function AdminSidebar({ isOpen, onOpenChange }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Sidebar */}
       <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetContent side="left" className="p-0 w-64">
             <SheetHeader className="sr-only">
               <SheetTitle>Menú de Administración</SheetTitle>
             </SheetHeader>
             <SidebarContent onLinkClick={() => onOpenChange(false)} />
          </SheetContent>
       </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-card md:flex flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
