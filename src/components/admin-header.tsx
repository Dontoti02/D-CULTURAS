
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, TriangleAlert } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export default function AdminHeader() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('stock', '<=', 5));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setLowStockProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching low stock products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <div className="relative ml-auto flex-1 md:grow-0">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {lowStockProducts.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                        </span>
                    )}
                    <span className="sr-only">Notificaciones de stock bajo</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <TriangleAlert className="h-5 w-5 text-destructive" />
                    <span>Notificaciones de Stock Bajo</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                    <div className="p-2 space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : lowStockProducts.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">No hay notificaciones</p>
                ) : (
                    lowStockProducts.map(product => (
                        <DropdownMenuItem key={product.id} asChild>
                            <Link href="/admin/inventory" className="flex items-center gap-3">
                                <Image
                                    src={product.images[0] || 'https://placehold.co/48x48.png'}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold truncate">{product.name}</p>
                                    <p className="text-xs text-destructive">
                                        Quedan {product.stock} unidades
                                    </p>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
         </DropdownMenu>
       </div>
    </header>
  );
}
