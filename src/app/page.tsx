
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/product-card';
import ProductFilters from '@/components/product-filters';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import PromotionsBanner from '@/components/promotions-banner';

type Gender = 'all' | 'Caballeros' | 'Damas';
type Category = 'Conjuntos' | 'Vestidos' | 'Faldas' | 'Blusas' | 'Ternos' | 'Camisas' | 'Pantalones' | 'Corbatas';

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [gender, setGender] = useState<Gender>('all');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [priceRange, setPriceRange] = useState<[number]>([500]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'));
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
  }, []);
  
  const handleGenderChange = (newGender: Gender) => {
    setGender(newGender);
    setSelectedCategories([]); // Reset categories when gender changes
  };

  const handleCategoryChange = (category: Category, checked: boolean) => {
      setSelectedCategories(prev => 
          checked ? [...prev, category] : prev.filter(c => c !== category)
      );
  };

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
        const genderMatch = gender === 'all' || product.gender === gender;
        const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
        const priceMatch = product.price <= priceRange[0];

        return genderMatch && categoryMatch && priceMatch;
    });
  }, [allProducts, gender, selectedCategories, priceRange]);


  return (
    <>
      <section className="bg-card py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary">
            Vive con Estilo: Elegancia y Comodidad en Cada Paso
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Descubre nuestra nueva colección, diseñada para quienes buscan sofisticación sin sacrificar la frescura. Piezas únicas que se adaptan a tu ritmo de vida, con diseños modernos y tejidos que respiran.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" onClick={() => setGender('Caballeros')}>Comprar Hombres</Button>
            <Button size="lg" variant="outline" onClick={() => setGender('Damas')}>Comprar Mujeres</Button>
          </div>
        </div>
      </section>

      <PromotionsBanner />

      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <ProductFilters 
              gender={gender}
              onGenderChange={handleGenderChange}
              categories={selectedCategories}
              onCategoryChange={handleCategoryChange}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
            />
          </aside>
          <main className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Todos los Productos</h2>
                <p className="text-muted-foreground">{filteredProducts.length} artículos</p>
            </div>
            <Separator className="mb-8" />
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </section>
    </>
  );
}
