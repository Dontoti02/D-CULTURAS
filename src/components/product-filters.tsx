
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

type Category = 'all' | 'Caballeros' | 'Damas' | 'Novedades Caballeros' | 'Novedades Damas';

interface ProductFiltersProps {
  category: Category;
  onCategoryChange: (value: Category) => void;
  priceRange: [number];
  onPriceChange: (value: [number]) => void;
}

const sizes = ['XS', 'S', 'M', 'L', 'XL'];

export default function ProductFilters({ 
    category, 
    onCategoryChange,
    priceRange,
    onPriceChange
}: ProductFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label className="font-semibold">Categoría</Label>
          <RadioGroup value={category} onValueChange={(value: Category) => onCategoryChange(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="cat-all" />
              <Label htmlFor="cat-all">Todos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Caballeros" id="cat-men" />
              <Label htmlFor="cat-men">Caballeros</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Damas" id="cat-women" />
              <Label htmlFor="cat-women">Damas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Novedades Caballeros" id="cat-new-men" />
              <Label htmlFor="cat-new-men">Novedades Caballeros</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Novedades Damas" id="cat-new-women" />
              <Label htmlFor="cat-new-women">Novedades Damas</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-2">
          <Label className="font-semibold">Talla</Label>
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => (
                <Button key={size} variant="outline" size="sm" className="w-12">{size}</Button>
            ))}
          </div>
        </div>
        
        <div className="grid gap-4">
          <Label className="font-semibold">Rango de Precios (S/)</Label>
          <Slider 
            value={priceRange} 
            onValueChange={(value) => onPriceChange(value as [number])}
            max={500} 
            step={10} 
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>S/ 0</span>
            <span>S/ {priceRange[0]}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
