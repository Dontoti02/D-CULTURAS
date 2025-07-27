'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, Users, LineChart, Shirt, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const navLinks = [
  { href: '/admin', label: 'Panel', icon: Home },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Clientes', icon: Users, disabled: true },
  { href: '/admin/analytics', label: 'Analíticas', icon: LineChart, disabled: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card p-6 flex flex-col">
       <div className="flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Shirt className="h-6 w-6 text-primary" />
              <span>stylesUP!</span>
            </Link>
        </div>
      <nav className="flex flex-col gap-2 flex-grow">
        {navLinks.map((link) => (
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
        ))}
      </nav>
      <div className="mt-auto">
        <Link href="/">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir a la Tienda
          </Button>
        </Link>
      </div>
    </aside>
  );
}
