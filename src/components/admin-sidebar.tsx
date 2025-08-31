

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
  Users2,
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
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Admin, AdminPermission } from '@/lib/types';


const navLinks: { href: string; label: string; icon: React.ElementType, permission: AdminPermission }[] = [
  { href: '/admin', label: 'Panel', icon: Home, permission: 'dashboard' },
  { href: '/admin/products', label: 'Productos', icon: Package, permission: 'products' },
  { href: '/admin/inventory', label: 'Inventario', icon: Warehouse, permission: 'inventory' },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart, permission: 'orders' },
  { href: '/admin/customers', label: 'Clientes', icon: Users, permission: 'customers' },
  { href: '/admin/promotions', label: 'Promociones', icon: Award, permission: 'promotions' },
  { href: '/admin/finance', label: 'Finanzas', icon: Landmark, permission: 'finance' },
  { href: '/admin/annual-closing', label: 'Cierre Anual', icon: Archive, permission: 'closing' },
  { href: '/admin/ai-assistant', label: 'Asistente IA', icon: Bot, permission: 'assistant' },
];

const settingsLinks: { href: string; label: string; icon: React.ElementType, permission: AdminPermission }[] = [
  { href: '/admin/settings', label: 'Mi Perfil', icon: Settings, permission: 'settings' },
  { href: '/admin/users', label: 'Usuarios', icon: Users2, permission: 'users' },
  { href: '/admin/billing', label: 'Facturación', icon: CreditCard, permission: 'billing' },
];


interface AdminSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: adminData, loading } = useAuth();


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

  const userCanAccess = (permission: AdminPermission) => {
    if (!adminData) return false;
    if (adminData.rol === 'admin') return true; // admin tiene acceso a todo
    return adminData.permissions?.[permission] ?? false;
  };


  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
            <div className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center bg-white p-2 shadow-md">
                <Image src="https://res.cloudinary.com/dd7fku9br/image/upload/v1756519561/logo_bhuwcw.svg" alt="Diseñando Culturas Logo" width={72} height={72} className="object-contain" />
            </div>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-2 -mr-2">
        {navLinks.map((link) => userCanAccess(link.permission) && (
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
         <Collapsible>
              <CollapsibleTrigger asChild>
                 <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 font-medium"
                >
                  <Settings className="h-4 w-4" />
                  Ajustes
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                  <div className="pl-8 pt-1">
                      {settingsLinks.map((link) => userCanAccess(link.permission) && (
                          <button
                            key={link.href}
                            onClick={() => handleLinkClick(link.href)}
                            className={cn(
                                'flex w-full text-left items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm',
                                {'text-primary': pathname === link.href}
                            )}
                            >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                          </button>
                      ))}
                  </div>
              </CollapsibleContent>
          </Collapsible>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 h-14"
              disabled={loading}
            >
              {loading || !adminData ? (
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
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            sideOffset={8}
          >
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
             {settingsLinks.map((link) => userCanAccess(link.permission) && (
                <DropdownMenuItem key={link.href} asChild>
                     <button className="w-full" onClick={() => handleLinkClick(link.href)}>
                        <link.icon className="mr-2 h-4 w-4" />
                        <span>{link.label}</span>
                    </button>
                </DropdownMenuItem>
             ))}
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
