
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Promotion } from '@/lib/types';

export default function EditPromotionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed' | ''>('');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<'active' | 'inactive' | 'scheduled'>('scheduled');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPromotion = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'promotions', id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const promoData = docSnap.data() as Promotion;
                setName(promoData.name);
                setDescription(promoData.description || '');
                setType(promoData.type);
                setValue(promoData.value.toString());
                setCode(promoData.code);
                setStartDate(promoData.startDate.toDate());
                setEndDate(promoData.endDate.toDate());
                setStatus(promoData.status);
                setImageUrl(promoData.imageUrl || null);
            } else {
                toast({ title: "Error", description: "Promoción no encontrada.", variant: "destructive" });
                router.push('/admin/promotions');
            }
        } catch (error) {
            console.error("Error fetching promotion:", error);
            toast({ title: "Error", description: "No se pudo cargar la promoción.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    fetchPromotion();
  }, [id, router, toast]);
  
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
          title: `Imagen Actualizada`,
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
      const promotionRef = doc(db, 'promotions', id as string);
      await updateDoc(promotionRef, {
        name,
        description,
        type,
        value: parseFloat(value),
        code,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        status,
        imageUrl,
      });
      toast({
        title: 'Promoción Actualizada',
        description: 'La campaña promocional se ha actualizado correctamente.',
      });
      router.push('/admin/promotions');
    } catch (error) {
      console.error("Error al actualizar la promoción: ", error);
      toast({
        title: 'Error al Actualizar',
        description: 'No se pudo actualizar la promoción en la base de datos.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
        <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-48" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Skeleton className="h-[550px] w-full" />
                </div>
                <div className="md:col-span-1">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-6">
        <div className="flex items-center gap-4">
           <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Editar Promoción
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" type="button" onClick={() => router.back()} disabled={isSubmitting || isUploading}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Promoción</CardTitle>
                    <CardDescription>
                    Modifica los detalles de tu campaña de marketing.
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
                        <Input id="code" type="text" placeholder="CYBERWOW40" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
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
                    <div className="grid gap-3">
                        <Label htmlFor="status">Estado de la Promoción</Label>
                        <Select required onValueChange={(value: 'active' | 'inactive' | 'scheduled') => setStatus(value)} value={status}>
                        <SelectTrigger aria-label="Seleccionar estado">
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Activa</SelectItem>
                            <SelectItem value="inactive">Inactiva</SelectItem>
                            <SelectItem value="scheduled">Programada</SelectItem>
                        </SelectContent>
                        </Select>
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
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </form>
  );
}
