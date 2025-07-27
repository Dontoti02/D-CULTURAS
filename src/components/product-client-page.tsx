'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { type Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star, Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import ProductCard from './product-card';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProductClientPageProps {
  product: Product;
}

const SOL_TO_USD_RATE = 3.85;

export default function ProductClientPage({ product }: ProductClientPageProps) {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

   useEffect(() => {
    const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(
            productsRef, 
            where('category', '==', product.category), 
            where('id', '!=', product.id), 
            limit(4)
        );
        const querySnapshot = await getDocs(q);
        const recs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setRecommendedProducts(recs);
      } catch (error) {
        console.error("Error fetching recommendations: ", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [product.id, product.category]);

  const priceInUsd = (product.price / SOL_TO_USD_RATE).toFixed(2);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Galería de Imágenes */}
        <div className="grid gap-4">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint="imagen del producto"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(img)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-md transition-all',
                  selectedImage === img ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80'
                )}
              >
                <Image
                  src={img}
                  alt={`${product.name} miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                  data-ai-hint="miniatura imagen producto"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Detalles del Producto */}
        <div className="grid gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('w-5 h-5', i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50')} />
                    ))}
                </div>
                <p className="text-sm text-muted-foreground">{product.rating} estrellas</p>
            </div>
          </div>
          <p className="text-muted-foreground">{product.description}</p>
          <div>
            <p className="text-4xl font-bold text-primary">S/ {product.price.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Precio referencial: ${priceInUsd} USD</p>
          </div>

          <div className="grid gap-4">
            {product.colors && product.colors.length > 0 && (
              <div>
                <Label className="font-semibold text-lg">Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-all',
                        selectedColor === color.name ? 'ring-2 ring-primary ring-offset-2' : ''
                      )}
                      style={{ backgroundColor: color.hex }}
                      aria-label={`Seleccionar color ${color.name}`}
                    />
                  ))}
                </div>
              </div>
            )}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <Label className="font-semibold text-lg">Talla</Label>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex gap-2 mt-2">
                  {product.sizes.map((size) => (
                      <Label
                          key={size}
                          htmlFor={`size-${size}`}
                          className={cn("border rounded-md px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground", {
                              "bg-primary text-primary-foreground": selectedSize === size,
                          })}
                      >
                          <RadioGroupItem value={size} id={`size-${size}`} className="sr-only" />
                          {size}
                      </Label>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border rounded-md">
                <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <Button size="lg" className="flex-1">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Añadir al Carrito
            </Button>
          </div>
        </div>
      </div>
      
      {/* Recomendaciones */}
      <div className="mt-16 pt-8">
        <h2 className="text-2xl font-bold mb-6">También te podría gustar</h2>
        <Separator className="mb-8" />
        {loadingRecommendations ? (
           <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recommendedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
        )}
      </div>
    </div>
  );
}
