
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Order } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

export default function ProfileOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderToReturn, setOrderToReturn] = useState<Order | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/login');
        return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('customerId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(userOrders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading, router]);

  const handleReturnRequest = async () => {
    if (!orderToReturn) return;
    setIsUpdating(true);
    try {
        const orderRef = doc(db, "orders", orderToReturn.id);
        await updateDoc(orderRef, { status: "Reportado" });
        
        // Update local state to reflect the change immediately
        setOrders(prevOrders => 
            prevOrders.map(o => o.id === orderToReturn.id ? { ...o, status: "Reportado" } : o)
        );

        toast({
            title: "Solicitud Recibida",
            description: "Tu solicitud de devolución ha sido enviada. Nos pondremos en contacto contigo pronto.",
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        toast({ title: "Error", description: "No se pudo procesar tu solicitud. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
        setIsUpdating(false);
        setOrderToReturn(null);
    }
  };


  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    )
  }

  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle>Mis Pedidos</CardTitle>
            <CardDescription>Aquí puedes ver el historial de todos tus pedidos.</CardDescription>
        </CardHeader>
        <CardContent>
            {orders.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Aún no has realizado ningún pedido.</p>
            </div>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[40%]">Productos</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {orders.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell>
                        <div className="flex flex-col gap-2">
                           {order.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <Image src={item.image} alt={item.name} width={48} height={64} className="rounded-md object-cover" />
                                    <div className='text-sm'>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-muted-foreground">Cant: {item.quantity}</p>
                                    </div>
                                </div>
                           ))}
                        </div>
                    </TableCell>
                    <TableCell>
                        <p>{format(order.createdAt.toDate(), 'dd/MM/yyyy')}</p>
                        <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 7)}</p>
                    </TableCell>
                    <TableCell className="font-semibold">S/ {order.total.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant={
                            order.status === 'Enviado' ? 'secondary' : 
                            order.status === 'Procesando' ? 'default' :
                            order.status === 'Entregado' ? 'outline' : 'destructive'
                        }>
                            {order.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {order.status === 'Entregado' && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setOrderToReturn(order)}
                                disabled={isUpdating}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Devolver
                            </Button>
                        )}
                         {order.status === 'Reportado' && (
                           <span className="text-xs text-muted-foreground italic">En proceso</span>
                        )}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            )}
        </CardContent>
        </Card>

        <AlertDialog open={!!orderToReturn} onOpenChange={(open) => !open && setOrderToReturn(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmas la solicitud de devolución?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esto iniciará el proceso de devolución para el pedido <span className="font-semibold">#{orderToReturn?.id.slice(0,7)}</span>. 
                        Nuestro equipo de soporte se pondrá en contacto contigo para coordinar los siguientes pasos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReturnRequest} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="animate-spin" /> : "Sí, solicitar devolución"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
