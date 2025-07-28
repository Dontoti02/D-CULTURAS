
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
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

      <Card>
        <CardHeader>
          <CardTitle>Todas las Promociones</CardTitle>
          <CardDescription>
            Aquí puedes ver todas las campañas promocionales que has creado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.name}</TableCell>
                   <TableCell>
                    <Badge variant="secondary">{promo.code}</Badge>
                  </TableCell>
                  <TableCell>
                    {promo.type === 'percentage' ? `${promo.value}%` : `S/ ${promo.value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>{format(promo.startDate.toDate(), 'P', { locale: es })} - {format(promo.endDate.toDate(), 'P', { locale: es })}</TableCell>
                  <TableCell>
                    <Badge variant={promo.status === 'active' ? 'default' : 'outline'} className="capitalize">{promo.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
