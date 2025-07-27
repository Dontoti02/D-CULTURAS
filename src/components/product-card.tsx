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
            {isNew && (
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">Nuevo</Badge>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg truncate">{product.name}</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-muted-foreground">{product.rating}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
                <Badge variant="outline">{product.category}</Badge>
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
