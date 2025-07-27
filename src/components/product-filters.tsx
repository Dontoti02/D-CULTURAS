'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface ProductFiltersProps {
  // En una aplicación real, estos serían props para controlar el estado de los filtros
}

const colors = [
    { name: 'Azul', hex: '#3B82F6' },
    { name: 'Negro', hex: '#000000' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Verde azulado', hex: '#2DD4BF' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Beige', hex: '#F5F5DC' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL'];

export default function ProductFilters({}: ProductFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label className="font-semibold">Categoría</Label>
          <RadioGroup defaultValue="all">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="cat-all" />
              <Label htmlFor="cat-all">Todos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="men" id="cat-men" />
              <Label htmlFor="cat-men">Hombres</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="women" id="cat-women" />
              <Label htmlFor="cat-women">Mujeres</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-2">
          <Label className="font-semibold">Color</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
                 <button key={color.name} className="h-8 w-8 rounded-full border" style={{ backgroundColor: color.hex }} aria-label={color.name} />
            ))}
          </div>
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
          <Label className="font-semibold">Rango de Precios</Label>
          <Slider defaultValue={[50]} max={500} step={10} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>$0</span>
            <span>$500</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
