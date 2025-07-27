
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
import { cn } from '@/lib/utils';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<(string | null)[]>(Array(4).fill(null));
  const [isUploading, setIsUploading] = useState<number | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(index);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'save_prendas'); 
    formData.append('cloud_name', 'dd7fku9br');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dd7fku9br/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newImageUrls = [...imageUrls];
        newImageUrls[index] = data.secure_url;
        setImageUrls(newImageUrls);
        toast({
            title: `Imagen ${index + 1} Subida`,
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
      setIsUploading(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar el nuevo producto con las imageUrls
    console.log('Image URLs to save:', imageUrls.filter(url => url !== null));
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
                  <CardDescription>Sube hasta 4 imágenes para tu producto.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imageUrls.map((url, index) => (
                             <div key={index} className="flex items-center justify-center w-full">
                                <Label htmlFor={`picture-${index}`} className={cn("relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted", { "overflow-hidden": url })}>
                                    {isUploading === index ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                                        </div>
                                    ) : url ? (
                                        <Image src={url} alt={`Vista previa ${index+1}`} layout="fill" objectFit="cover" className="rounded-lg" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-2">
                                            <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">Subir Imagen {index + 1}</p>
                                        </div>
                                    )}
                                    <Input id={`picture-${index}`} type="file" className="hidden" onChange={(e) => handleImageUpload(e, index)} accept="image/*" disabled={isUploading !== null} />
                                </Label>
                            </div>
                        ))}
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
                        <SelectItem value="Caballeros">Caballeros</SelectItem>
                        <SelectItem value="Damas">Damas</SelectItem>
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

