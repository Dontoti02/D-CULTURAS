
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from './ui/checkbox';

type Gender = 'all' | 'Caballeros' | 'Damas';
type Category = 'Conjuntos' | 'Vestidos' | 'Faldas' | 'Blusas' | 'Ternos' | 'Camisas' | 'Pantalones' | 'Corbatas';

const categoriesByGender = {
  'Damas': ['Conjuntos', 'Vestidos', 'Faldas', 'Blusas'],
  'Caballeros': ['Ternos', 'Camisas', 'Pantalones', 'Corbatas'],
};


interface ProductFiltersProps {
  gender: Gender;
  onGenderChange: (value: Gender) => void;
  categories: Category[];
  onCategoryChange: (category: Category, checked: boolean) => void;
  priceRange: [number];
  onPriceChange: (value: [number]) => void;
}

const sizes = ['XS', 'S', 'M', 'L', 'XL'];

export default function ProductFilters({ 
    gender, 
    onGenderChange,
    categories,
    onCategoryChange,
    priceRange,
    onPriceChange
}: ProductFiltersProps) {
  const availableCategories = gender === 'all' 
    ? [...categoriesByGender.Damas, ...categoriesByGender.Caballeros] 
    : categoriesByGender[gender as 'Damas' | 'Caballeros'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label className="font-semibold">Género</Label>
          <RadioGroup value={gender} onValueChange={(value: Gender) => onGenderChange(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="gender-all" />
              <Label htmlFor="gender-all">Todos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Damas" id="gender-women" />
              <Label htmlFor="gender-women">Damas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Caballeros" id="gender-men" />
              <Label htmlFor="gender-men">Caballeros</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-2">
            <Label className="font-semibold">Categoría</Label>
            <div className="space-y-2">
                {availableCategories.map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                        <Checkbox
                            id={`cat-${cat}`}
                            checked={categories.includes(cat as Category)}
                            onCheckedChange={(checked) => onCategoryChange(cat as Category, !!checked)}
                            disabled={gender === 'all'}
                        />
                        <Label htmlFor={`cat-${cat}`} className="font-normal">
                            {cat}
                        </Label>
                    </div>
                ))}
            </div>
            {gender === 'all' && (
                <p className="text-xs text-muted-foreground">Selecciona un género para filtrar por categoría.</p>
            )}
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
