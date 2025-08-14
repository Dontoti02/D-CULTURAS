
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/lib/types';
import ProductCard from '@/components/product-card';
import { Separator } from '@/components/ui/separator';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import PromotionsBanner from '@/components/promotions-banner';

type Category = 'Conjuntos' | 'Vestidos' | 'Faldas' | 'Blusas' | 'Ternos' | 'Camisas' | 'Pantalones' | 'Corbatas';

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const category = searchParams.get('category') as Category | null;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        let q;

        if (category) {
            q = query(productsRef, where('category', '==', category), orderBy('createdAt', 'desc'));
        } else {
            q = query(productsRef, orderBy('createdAt', 'desc'));
        }
        
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setAllProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  return (
    <>
      <PromotionsBanner />

      <section className="container mx-auto px-4 md:px-6 py-12">
          <main>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{category || 'Todos los Productos'}</h2>
                <p className="text-muted-foreground">{allProducts.length} artículos</p>
            </div>
            <Separator className="mb-8" />
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
      </section>
    </>
  );
}
