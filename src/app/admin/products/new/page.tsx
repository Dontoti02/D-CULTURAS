
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Image from 'next/image';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'save_prendas'); 

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dd7fku9br/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.secure_url);
        toast({
            title: 'Imagen Subida',
            description: 'La imagen del producto se ha subido correctamente.',
        });
      } else {
        throw new Error('Error al subir la imagen');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar el nuevo producto con la imageUrl
    console.log('Image URL to save:', imageUrl);
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
                            <Label htmlFor="picture" className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                {isUploading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
                                        <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                                    </div>
                                ) : imageUrl ? (
                                    <Image src={imageUrl} alt="Vista previa del producto" layout="fill" objectFit="cover" className="rounded-lg" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p>
                                        <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF</p>
                                    </div>
                                )}
                                <Input id="picture" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isUploading} />
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
