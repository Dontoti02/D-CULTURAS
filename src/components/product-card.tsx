
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { type Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const avgRating = product.ratingCount > 0 ? (product.ratingSum / product.ratingCount) : 0;
  const filledStars = Math.round(avgRating);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Detener la navegación del Link padre
    e.stopPropagation();

    if (product.stock > 0 && product.sizes.length > 0) {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: 1,
            size: product.sizes[0], // Añadir la primera talla disponible
        });
        toast({
            title: '¡Añadido al carrito!',
            description: `${product.name} (Talla: ${product.sizes[0]}) ha sido añadido.`,
        });
    } else {
        toast({
            title: 'Producto no disponible',
            description: 'Este producto está agotado o no tiene tallas definidas.',
            variant: 'destructive',
        });
    }
  };


  return (
    <Link href={`/product/${product.id}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg border-none shadow-none rounded-none h-full flex flex-col">
        <CardContent className="p-0 flex-grow flex flex-col">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="product image"
            />
          </div>
          <div className="p-4 mt-auto">
             <div className="flex items-center gap-1">
                <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('w-4 h-4', i < filledStars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />
                    ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">({product.ratingCount})</span>
            </div>
            <p className="font-semibold text-lg mt-1">S/ {product.price.toFixed(2)}</p>
            <div className="flex justify-between items-center gap-2 mt-1">
                <h3 className="text-sm text-muted-foreground truncate flex-1">{product.name}</h3>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="shrink-0 rounded-full w-8 h-8 bg-muted hover:bg-primary hover:text-primary-foreground"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="sr-only">Añadir al carrito</span>
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
