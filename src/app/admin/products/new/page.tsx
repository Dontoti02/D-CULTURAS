
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Caballeros' | 'Damas' | 'Novedades Caballeros' | 'Novedades Damas' | ''>('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrls, setImageUrls] = useState<(string | null)[]>(Array(4).fill(null));
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!category) {
      toast({
        title: 'Selecciona una categoría primero',
        description: 'Debes elegir una categoría para el producto antes de subir imágenes.',
        variant: 'destructive',
      });
      event.target.value = ''; // Reset file input
      return;
    }

    setIsUploading(index);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'save_prendas');
    formData.append('cloud_name', 'dd7fku9br');
    formData.append('folder', category.toLowerCase());

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !category || !price || !cost || !stock || imageUrls.every(url => url === null)) {
        toast({
            title: 'Campos Incompletos',
            description: 'Por favor, rellena todos los campos y sube al menos una imagen.',
            variant: 'destructive',
        });
        return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'products'), {
        name,
        description,
        category,
        price: parseFloat(price),
        cost: parseFloat(cost),
        stock: parseInt(stock, 10),
        images: imageUrls.filter((url): url is string => url !== null),
        sizes: ['S', 'M', 'L', 'XL'],
        ratingSum: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Producto Agregado',
        description: 'El nuevo producto se ha guardado correctamente en Firebase.',
      });
      router.push('/admin/products');
    } catch (error) {
      console.error("Error al guardar el producto: ", error);
      toast({
        title: 'Error al Guardar',
        description: 'No se pudo guardar el producto en la base de datos.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <Button variant="outline" size="sm" onClick={() => router.back()} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={isSubmitting || isUploading !== null}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Producto'}
              </Button>
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu producto..."
                      className="min-h-32"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Imágenes del Producto</CardTitle>
                  <CardDescription>Sube hasta 4 imágenes para tu producto. Debes seleccionar una categoría primero.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imageUrls.map((url, index) => (
                             <div key={index} className="flex items-center justify-center w-full">
                                <Label htmlFor={`picture-${index}`} className={cn("relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted", { "overflow-hidden": url, "cursor-not-allowed opacity-50": !category })}>
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
                                    <Input id={`picture-${index}`} type="file" className="hidden" onChange={(e) => handleImageUpload(e, index)} accept="image/*" disabled={!category || isUploading !== null || isSubmitting} />
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
                  <CardTitle>Categoría y Precios</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="category">Categoría</Label>
                    <Select required onValueChange={(value: 'Caballeros' | 'Damas' | 'Novedades Caballeros' | 'Novedades Damas') => setCategory(value)} value={category}>
                      <SelectTrigger id="category" aria-label="Seleccionar categoría">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Caballeros">Caballeros</SelectItem>
                        <SelectItem value="Damas">Damas</SelectItem>
                        <SelectItem value="Novedades Caballeros">Novedades Caballeros</SelectItem>
                        <SelectItem value="Novedades Damas">Novedades Damas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="price">Precio (S/)</Label>
                            <Input id="price" type="number" placeholder="99.99" required value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                         <div className="grid gap-3">
                            <Label htmlFor="cost">Costo (S/)</Label>
                            <Input id="cost" type="number" placeholder="49.99" required value={cost} onChange={(e) => setCost(e.target.value)} />
                        </div>
                   </div>
                   <div className="grid gap-3">
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" placeholder="100" required value={stock} onChange={(e) => setStock(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
            <Button size="sm" type="submit" disabled={isSubmitting || isUploading !== null}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Producto'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
