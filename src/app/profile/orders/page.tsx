
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Order, OrderItem } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
import { Loader2, RotateCcw, Minus, Plus } from 'lucide-react';
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

export default function ProfileOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderToReturn, setOrderToReturn] = useState<Order | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<{[key: string]: number}>({});
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const fetchOrders = async () => {
    if (!user) return;
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


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/login');
        return;
    }
    fetchOrders();
  }, [user, authLoading, router]);

  const openReturnDialog = (order: Order) => {
    setOrderToReturn(order);
    const initialQuantities = order.items.reduce((acc, item) => {
        const uniqueKey = `${item.productId}-${item.size}`;
        acc[uniqueKey] = 0;
        return acc;
    }, {} as {[key: string]: number});
    setReturnQuantities(initialQuantities);
  };

  const handleQuantityChange = (item: OrderItem, delta: number) => {
    const uniqueKey = `${item.productId}-${item.size}`;
    const currentQty = returnQuantities[uniqueKey] || 0;
    const newQty = Math.max(0, Math.min(item.quantity, currentQty + delta));
    setReturnQuantities(prev => ({ ...prev, [uniqueKey]: newQty }));
  };


  const handleReturnRequest = async () => {
    if (!orderToReturn) return;

    const itemsToReturn = orderToReturn.items
        .map(item => {
            const uniqueKey = `${item.productId}-${item.size}`;
            const quantity = returnQuantities[uniqueKey];
            return quantity > 0 ? { ...item, quantity } : null;
        })
        .filter((item): item is OrderItem => item !== null);

    if (itemsToReturn.length === 0) {
        toast({
            title: "No se seleccionaron productos",
            description: "Debes seleccionar la cantidad de al menos un producto para devolver.",
            variant: "destructive"
        });
        return;
    }
    
    setIsUpdating(true);
    try {
        const orderRef = doc(db, "orders", orderToReturn.id);
        await updateDoc(orderRef, { 
            status: "Reportado",
            returnedItems: {
                items: itemsToReturn,
                requestedAt: Timestamp.now()
            }
        });
        
        toast({
            title: "Solicitud Recibida",
            description: "Tu solicitud de devolución ha sido enviada. Nos pondremos en contacto contigo pronto.",
        });

        // Refetch orders to update the UI
        await fetchOrders();

    } catch (error) {
        console.error("Error updating order status:", error);
        toast({ title: "Error", description: "No se pudo procesar tu solicitud. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
        setIsUpdating(false);
        setOrderToReturn(null);
    }
  };

  const isReturnPeriodExpired = (order: Order): boolean => {
    if (!order.deliveredAt) return true; // Cannot return if not delivered
    return differenceInDays(new Date(), order.deliveredAt.toDate()) > 3;
  }


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
                        {order.status === 'Entregado' && !isReturnPeriodExpired(order) && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openReturnDialog(order)}
                                disabled={isUpdating}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Devolver
                            </Button>
                        )}
                        {order.status === 'Entregado' && isReturnPeriodExpired(order) && (
                           <span className="text-xs text-muted-foreground italic">Plazo de devolución expirado.</span>
                        )}
                         {order.status === 'Reportado' && (
                           <span className="text-xs text-muted-foreground italic">Devolución en proceso</span>
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
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Solicitar Devolución</AlertDialogTitle>
                    <AlertDialogDescription>
                       Selecciona los productos y la cantidad que deseas devolver. Tienes 3 días después de la entrega para solicitar una devolución.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                    {orderToReturn?.items.map(item => {
                        const uniqueKey = `${item.productId}-${item.size}`;
                        const quantityToReturn = returnQuantities[uniqueKey] || 0;
                        return (
                            <div key={uniqueKey} className="flex items-center justify-between gap-4 border-b pb-4">
                               <div className="flex items-center gap-3">
                                    <Image src={item.image} alt={item.name} width={48} height={64} className="rounded-md object-cover" />
                                    <div className='text-sm'>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-muted-foreground">Talla: {item.size} / Cant. Pedida: {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 border rounded-md">
                                    <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(item, -1)} disabled={quantityToReturn <= 0}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-8 text-center font-semibold">{quantityToReturn}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(item, 1)} disabled={quantityToReturn >= item.quantity}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReturnRequest} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="animate-spin" /> : "Enviar Solicitud"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
