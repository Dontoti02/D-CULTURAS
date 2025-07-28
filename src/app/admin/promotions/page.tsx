
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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

// Dummy data for now
const dummyPromotions = [
    { id: 'promo1', name: 'Cyber Wow', type: 'percentage', value: 40, status: 'active', startDate: '2024-10-20', endDate: '2024-10-27' },
    { id: 'promo2', name: '20% Off Polos', type: 'percentage', value: 20, status: 'inactive', startDate: '2024-09-01', endDate: '2024-09-30' },
    { id: 'promo3', name: 'Descuento Primera Compra', type: 'fixed', value: 15, status: 'active', startDate: '2024-01-01', endDate: '2024-12-31' },
    { id: 'promo4', name: 'Liquidacion Verano', type: 'percentage', value: 50, status: 'scheduled', startDate: '2025-02-15', endDate: '2025-02-28' },
];

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState(dummyPromotions);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<any>(null);
  const { toast } = useToast();

  // Here you would fetch promotions from Firestore
  // useEffect(() => {
  //   fetchPromotions();
  // }, []);

  const handleDeletePromotion = () => {
    // Logic to delete from Firestore
    toast({ title: "Promoción Eliminada", description: "La promoción ha sido eliminada." });
    setPromotionToDelete(null);
  }

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
          <CardTitle>Promociones Activas y Pasadas</CardTitle>
          <CardDescription>
            Aquí puedes ver todas las campañas promocionales que has creado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre de la Campaña</TableHead>
                <TableHead>Tipo</TableHead>
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
                  <TableCell>{promo.type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</TableCell>
                  <TableCell>
                    {promo.type === 'percentage' ? `${promo.value}%` : `S/ ${promo.value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>{promo.startDate} - {promo.endDate}</TableCell>
                  <TableCell>
                    <Badge variant={
                      promo.status === 'active' ? 'default' :
                      promo.status === 'scheduled' ? 'secondary' : 'outline'
                    } className="capitalize">{promo.status}</Badge>
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
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
