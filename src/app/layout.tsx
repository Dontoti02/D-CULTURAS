
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/context/cart-context';
import { AuthProvider } from '@/hooks/use-auth';

// export const metadata: Metadata = {
//   title: 'Diseñando Culturas',
//   description: 'Ropa moderna para hombre y mujer.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="es">
      <head>
        <title>Diseñando Culturas</title>
        <meta name="description" content="Ropa moderna con un toque de cultura y diseño." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            <CartProvider>
                <div className="relative flex min-h-screen flex-col">
                {!isAdminRoute && <SiteHeader />}
                <main className="flex-1">{children}</main>
                {!isAdminRoute && <SiteFooter />}
                </div>
                <Toaster />
            </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
