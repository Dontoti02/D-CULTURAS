import Link from 'next/link';
import Image from 'next/image';
import { type Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface ProductCardProps {
  product: Product;
}

const SOL_TO_USD_RATE = 3.85;

export default function ProductCard({ product }: ProductCardProps) {
  const isNew = product.createdAt && differenceInDays(new Date(), product.createdAt.toDate()) <= 7;
  const priceInUsd = (product.price / SOL_TO_USD_RATE).toFixed(2);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const avgRating = product.ratingCount > 0 ? (product.ratingSum / product.ratingCount) : 0;


  return (
    <Link href={`/product/${product.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg group">
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
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg truncate">{product.name}</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex items-start justify-between mt-2 gap-2">
                <div className="flex flex-col items-start">
                    <Badge variant="outline">{product.gender}</Badge>
                    <Badge variant="secondary" className="mt-1">{product.category}</Badge>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">S/ {product.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">aprox. ${priceInUsd} USD</p>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
