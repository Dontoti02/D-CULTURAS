
'use client'

import { useState, useEffect } from 'react';
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
import { MoreHorizontal, PlusCircle, Loader2, Clock } from 'lucide-react';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import CountdownTimer from '@/components/countdown-timer';

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
                           <div className="flex items-center gap-2 text-sm font-medium mb-2">
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

