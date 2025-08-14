
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Product } from '@/lib/types';
import ProductCard from '@/components/product-card';
import { Separator } from '@/components/ui/separator';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import PromotionsBanner from '@/components/promotions-banner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Category = 'Conjuntos' | 'Vestidos' | 'Faldas' | 'Blusas' | 'Ternos' | 'Camisas' | 'Pantalones' | 'Corbatas';
const PRODUCTS_PER_PAGE = 10;

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const category = searchParams.get('category') as Category | null;
  const currentPage = Number(searchParams.get('page')) || 1;

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
  
  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return allProducts.slice(startIndex, endIndex);
  }, [allProducts, currentPage]);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const renderPaginationItems = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const ellipsis = <PaginationItem key="ellipsis"><PaginationEllipsis /></PaginationItem>;

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <PaginationItem key={i}>
            <PaginationLink href={createPageURL(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      pageNumbers.push(
        <PaginationItem key={1}>
          <PaginationLink href={createPageURL(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Logic for ellipsis and middle numbers
      if (currentPage > maxPagesToShow - 2) {
        pageNumbers.push(React.cloneElement(ellipsis, { key: 'start-ellipsis' }));
      }

      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);
      
      if (currentPage < maxPagesToShow - 1) {
          endPage = maxPagesToShow -1;
      }
      if (currentPage > totalPages - (maxPagesToShow - 2)) {
          startPage = totalPages - (maxPagesToShow-2)
      }


      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <PaginationItem key={i}>
            <PaginationLink href={createPageURL(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - (maxPagesToShow-3)) {
        pageNumbers.push(React.cloneElement(ellipsis, { key: 'end-ellipsis' }));
      }


      // Always show last page
      pageNumbers.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href={createPageURL(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pageNumbers;
  };


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
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
             {totalPages > 1 && (
                <div className="mt-12">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious href={createPageURL(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} />
                            </PaginationItem>
                            {renderPaginationItems()}
                            <PaginationItem>
                                <PaginationNext href={createPageURL(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
          </main>
      </section>
    </>
  );
}
