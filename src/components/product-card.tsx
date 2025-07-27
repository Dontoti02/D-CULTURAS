import Link from 'next/link';
import Image from 'next/image';
import { type Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint="product image"
            />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-muted-foreground">{product.rating}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
                <Badge variant="outline">{product.category}</Badge>
                <p className="font-semibold text-primary">${product.price.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
