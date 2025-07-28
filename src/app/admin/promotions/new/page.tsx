
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function NewPromotionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed' | ''>('');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    setCode(randomCode);
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'save_prendas');
    formData.append('cloud_name', 'dd7fku9br');
    formData.append('folder', 'promotions');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dd7fku9br/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.secure_url);
        toast({
          title: `Imagen Subida`,
          description: 'La imagen de la promoción se ha subido correctamente.',
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !value || !startDate || !endDate || !code || !imageUrl) {
      toast({
        title: 'Campos Incompletos',
        description: 'Por favor, completa todos los campos y sube una imagen.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'promotions'), {
        name,
        description,
        type,
        value: parseFloat(value),
        code,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        status: 'active', // Default status
        imageUrl,
        createdAt: new Date(),
      });
      toast({
        title: 'Promoción Creada',
        description: 'La nueva campaña promocional se ha guardado correctamente.',
      });
      router.push('/admin/promotions');
    } catch (error) {
      console.error("Error al crear la promoción: ", error);
      toast({
        title: 'Error al Guardar',
        description: 'No se pudo guardar la promoción en la base de datos.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-6">
        <div className="flex items-center gap-4">
           <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Crear Nueva Promoción
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" type="button" onClick={() => router.back()} disabled={isSubmitting || isUploading}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Promoción'}
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Promoción</CardTitle>
                    <CardDescription>
                    Configura los detalles para tu nueva campaña de marketing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-3">
                    <Label htmlFor="name">Nombre de la Campaña</Label>
                    <Input id="name" type="text" placeholder="Ej. Cyber Wow 2024" required value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <Textarea id="description" placeholder="Describe la promoción para los clientes." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="type">Tipo de Descuento</Label>
                        <Select required onValueChange={(value: 'percentage' | 'fixed') => setType(value)} value={type}>
                        <SelectTrigger aria-label="Seleccionar tipo">
                            <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                            <SelectItem value="fixed">Monto Fijo (S/)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="value">Valor del Descuento</Label>
                        <Input id="value" type="number" placeholder={type === 'percentage' ? "40" : "20.00"} required value={value} onChange={(e) => setValue(e.target.value)} />
                    </div>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="code">Código de Cupón</Label>
                        <div className="flex items-center gap-2">
                            <Input id="code" type="text" placeholder="CYBERWOW40" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                            <Button type="button" variant="outline" onClick={generateRandomCode}>Generar</Button>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label>Fecha de Inicio</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-3">
                        <Label>Fecha de Fin</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Imagen de la Promoción</CardTitle>
                        <CardDescription>Sube una imagen atractiva para tu campaña.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center w-full">
                            <Label htmlFor="picture" className={cn("relative flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted", { "overflow-hidden": imageUrl })}>
                                {isUploading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                                    </div>
                                ) : imageUrl ? (
                                    <Image src={imageUrl} alt="Vista previa de promoción" layout="fill" objectFit="cover" className="rounded-lg" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-2">
                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Subir Imagen</p>
                                        <p className="text-xs text-muted-foreground">Aspecto 16:9 recomendado</p>
                                    </div>
                                )}
                                <Input id="picture" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={isUploading || isSubmitting} />
                            </Label>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm" type="button" onClick={() => router.back()} disabled={isSubmitting || isUploading}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Promoción'}
          </Button>
        </div>
      </div>
    </form>
  );
}
