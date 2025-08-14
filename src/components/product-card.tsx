import Link from 'next/link';
import Image from 'next/image';
import { type Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

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
    <Link href={`/product/${product.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg group border-none shadow-none rounded-none">
        <CardContent className="p-0">
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
          <div className="p-2 space-y-1">
            <h3 className="text-sm text-muted-foreground truncate">{product.name}</h3>
            <p className="font-semibold text-lg">S/ {product.price.toFixed(2)}</p>
            <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-4 h-4', i < filledStars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />
                ))}
                <span className="text-sm text-muted-foreground">({product.ratingCount})</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
