
import Link from 'next/link';
import Image from 'next/image';
import { type Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isNew = product.createdAt && differenceInDays(new Date(), product.createdAt.toDate()) <= 7;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const avgRating = product.ratingCount > 0 ? (product.ratingSum / product.ratingCount) : 0;
  const filledStars = Math.round(avgRating);

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
            <div className="absolute top-3 flex gap-2 w-full px-3">
                 {isOutOfStock && (
                    <Badge variant="destructive" className="bg-destructive/80">Agotado</Badge>
                )}
                {isLowStock && (
                    <Badge variant="secondary" className="bg-yellow-400/80 text-yellow-900">Bajo Stock</Badge>
                )}
                 {isNew && (
                    <Badge className="bg-primary/80 text-primary-foreground ml-auto">Nuevo</Badge>
                )}
            </div>
          </div>
          <div className="p-2 mt-auto">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 space-y-1">
                    <h3 className="text-sm text-muted-foreground truncate">{product.name}</h3>
                    <p className="font-semibold text-lg">S/ {product.price.toFixed(2)}</p>
                    <div className="flex items-center gap-1">
                        <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn('w-4 h-4', i < filledStars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground ml-1">({product.ratingCount})</span>
                    </div>
                </div>
                 <Button size="icon" variant="ghost" className="shrink-0">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Añadir al carrito</span>
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
