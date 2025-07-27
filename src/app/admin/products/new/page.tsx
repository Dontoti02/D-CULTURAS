'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar el nuevo producto
    toast({
        title: 'Producto Agregado',
        description: 'El nuevo producto se ha guardado correctamente.',
    });
    router.push('/admin/products');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              Nuevo Producto
            </h1>
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button size="sm" type="submit">Guardar Producto</Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles del Producto</CardTitle>
                  <CardDescription>
                    Ingresa los detalles para el nuevo producto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      type="text"
                      className="w-full"
                      placeholder="Ej. Camiseta Gráfica"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu producto..."
                      className="min-h-32"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Imágenes del Producto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                       <div className="flex items-center justify-center w-full">
                            <Label htmlFor="picture" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p>
                                    <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                                </div>
                                <Input id="picture" type="file" className="hidden" />
                            </Label>
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Categoría y Precio</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="category">Categoría</Label>
                    <Select required>
                      <SelectTrigger id="category" aria-label="Seleccionar categoría">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hombres">Caballeros</SelectItem>
                        <SelectItem value="mujeres">Damas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="grid gap-3">
                    <Label htmlFor="price">Precio</Label>
                    <Input id="price" type="number" placeholder="99.99" required />
                  </div>
                   <div className="grid gap-3">
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" placeholder="100" required />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" onClick={() => router.back()}>Cancelar</Button>
            <Button size="sm" type="submit">Guardar Producto</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
