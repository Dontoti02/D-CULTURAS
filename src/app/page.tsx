'use client';

import { useState } from 'react';
import { products as allProducts } from '@/lib/data';
import ProductCard from '@/components/product-card';
import ProductFilters from '@/components/product-filters';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [products, setProducts] = useState(allProducts);

  // Filtering logic would go here in a real app

  return (
    <>
      <section className="bg-card py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary">
            Feel the Style of Summer
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Discover our new collection of clothing that combines comfort and elegance for the modern individual.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg">Shop Men</Button>
            <Button size="lg" variant="outline">Shop Women</Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <ProductFilters />
          </aside>
          <main className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">All Products</h2>
                <p className="text-muted-foreground">{products.length} items</p>
            </div>
            <Separator className="mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </main>
        </div>
      </section>
    </>
  );
}
