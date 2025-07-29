
'use client'

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Loader2, Clock, GanttChartSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Promotion } from '@/lib/types';
import { format, differenceInDays, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import CountdownTimer from '@/components/countdown-timer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "promotions"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const promotionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion));
      setPromotions(promotionsData);
    } catch (error) {
      console.error("Error fetching promotions: ", error);
      toast({ title: "Error", description: "No se pudieron cargar las promociones.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDeletePromotion = async () => {
    if (!promotionToDelete) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, "promotions", promotionToDelete.id));
        toast({ title: "Promoción Eliminada", description: "La promoción ha sido eliminada correctamente." });
        setPromotionToDelete(null);
        await fetchPromotions(); // Refetch promotions list
    } catch (error) {
        console.error("Error deleting promotion: ", error);
        toast({ title: "Error", description: "No se pudo eliminar la promoción.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };

  const ganttChartData = useMemo(() => {
    if (promotions.length === 0) return null;

    const allDates = promotions.flatMap(p => [p.startDate.toDate(), p.endDate.toDate()]);
    const chartStartDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
    let chartEndDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));

    // Ensure chart shows at least 3 months for context
    if (differenceInDays(chartEndDate, chartStartDate) < 90) {
        chartEndDate = endOfMonth(addMonths(chartStartDate, 2));
    }

    const totalDays = differenceInDays(chartEndDate, chartStartDate) + 1;
    
    const months = [];
    let currentMonth = chartStartDate;
    while (currentMonth <= chartEndDate) {
        const daysInMonth = differenceInDays(endOfMonth(currentMonth), startOfMonth(currentMonth)) + 1;
        months.push({
            name: format(currentMonth, 'MMMM yyyy', { locale: es }),
            days: daysInMonth,
        });
        currentMonth = addMonths(currentMonth, 1);
    }
    
    const colors = ['#3b82f6', '#10b981', '#ef4444', '#eab308', '#8b5cf6', '#f97316'];

    const items = promotions.map((promo, index) => {
        const startDate = startOfDay(promo.startDate.toDate());
        const endDate = startOfDay(promo.endDate.toDate());
        const startOffset = differenceInDays(startDate, chartStartDate);
        const duration = differenceInDays(endDate, startDate) + 1;
        
        return {
            ...promo,
            gantt: {
                start: (startOffset / totalDays) * 100,
                width: (duration / totalDays) * 100,
                color: colors[index % colors.length],
            }
        };
    });

    return { chartStartDate, chartEndDate, totalDays, months, items };
  }, [promotions]);


  const now = new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Promociones</h1>
          <p className="text-muted-foreground">Crea y administra tus campañas de ofertas y descuentos.</p>
        </div>
        <Button asChild>
          <Link href="/admin/promotions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Promoción
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => {
             const isActive = promo.status === 'active' && promo.startDate.toDate() <= now && promo.endDate.toDate() >= now;
             return (
              <Card key={promo.id} className="overflow-hidden flex flex-col">
                <CardHeader className="p-0 relative">
                  <div className="relative aspect-video w-full">
                     <Image
                        src={promo.imageUrl || 'https://placehold.co/600x400.png'}
                        alt={promo.name}
                        fill
                        className="object-cover"
                     />
                     <div className="absolute top-2 right-2">
                        <Badge variant={isActive ? 'default' : 'outline'} className="capitalize backdrop-blur-sm bg-background/50">
                          {promo.status}
                        </Badge>
                     </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg mb-2">{promo.name}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/admin/promotions/edit/${promo.id}`)}>
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPromotionToDelete(promo)} className="text-destructive">
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {promo.type === 'percentage' ? `${promo.value}% de descuento` : `S/ ${promo.value.toFixed(2)} de descuento`}
                    </p>
                    <div className="flex items-center gap-2">
                        <p className="text-sm">Código:</p>
                        <Badge variant="secondary">{promo.code}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vigencia: {format(promo.startDate.toDate(), 'P', { locale: es })} - {format(promo.endDate.toDate(), 'P', { locale: es })}
                    </p>
                </CardContent>
                {isActive && (
                    <CardFooter className="bg-muted/50 p-4">
                        <div className="w-full">
                           <div className="flex items-center gap-2 text-sm font-medium mb-2 text-primary">
                                <Clock className="w-4 h-4" />
                                <span>Tiempo restante:</span>
                           </div>
                           <CountdownTimer endDate={promo.endDate.toDate()} />
                        </div>
                    </CardFooter>
                )}
              </Card>
          )})}
      </div>
      
       {ganttChartData && (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GanttChartSquare />
                        Cronograma de Promociones
                    </CardTitle>
                    <CardDescription>Visualización de la duración y superposición de las campañas.</CardDescription>
                </CardHeader>
                <CardContent className="pr-10">
                    <TooltipProvider>
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex text-xs text-muted-foreground">
                            <div className="w-48 pr-4 border-r"></div>
                            <div className="flex-1 flex">
                                {ganttChartData.months.map(month => (
                                    <div key={month.name} style={{ width: `${(month.days / ganttChartData.totalDays) * 100}%`}} className="text-center border-l capitalize">
                                        {month.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Rows */}
                        <div className="relative">
                            {ganttChartData.items.map((item, index) => (
                                <div key={item.id} className="flex items-center h-10">
                                    <div className="w-48 pr-4 border-r text-sm font-medium truncate">{item.name}</div>
                                    <div className="flex-1 pl-2 h-full">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div 
                                                    className="h-6 rounded-md my-2 cursor-pointer hover:opacity-80"
                                                    style={{ 
                                                        marginLeft: `${item.gantt.start}%`, 
                                                        width: `${item.gantt.width}%`,
                                                        backgroundColor: item.gantt.color
                                                    }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-bold">{item.name}</p>
                                                <p className="text-sm">
                                                    {format(item.startDate.toDate(), 'dd MMM yyyy', { locale: es })} - {format(item.endDate.toDate(), 'dd MMM yyyy', { locale: es })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{differenceInDays(item.endDate.toDate(), item.startDate.toDate()) + 1} días</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    </TooltipProvider>
                </CardContent>
            </Card>
        )}

      <AlertDialog open={!!promotionToDelete} onOpenChange={(open) => !open && setPromotionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la campaña <span className="font-semibold">{promotionToDelete?.name}</span> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePromotion} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="animate-spin" /> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
