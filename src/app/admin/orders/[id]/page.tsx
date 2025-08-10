
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, User, Package, Truck, HomeIcon } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type EnrichedOrder = Order & { customerData?: Customer };
type OrderStatus = 'Procesando' | 'Enviado' | 'Entregado' | 'Cancelado' | 'Reportado';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<EnrichedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');

  useEffect(() => {
    if (!id) return;

    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const orderRef = doc(db, 'orders', id as string);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
          let customerData: Customer | undefined;

          // Fetch customer data
          const customerRef = doc(db, 'customers', orderData.customerId);
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists()) {
            customerData = { id: customerSnap.id, ...customerSnap.data() } as Customer;
          }

          setOrder({ ...orderData, customerData });
          setSelectedStatus(orderData.status);
        } else {
          toast({ title: "Error", description: "Pedido no encontrado.", variant: "destructive" });
          router.push('/admin/orders');
        }
      } catch (error) {
        console.error("Error fetching order details: ", error);
        toast({ title: "Error", description: "No se pudo cargar el pedido.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, router, toast]);

  const handleStatusUpdate = async () => {
    if (!id || !selectedStatus || selectedStatus === order?.status) return;

    setIsUpdating(true);
    try {
      const orderRef = doc(db, 'orders', id as string);
      const updateData: { status: OrderStatus; deliveredAt?: any } = { status: selectedStatus };

      if (selectedStatus === 'Entregado') {
        updateData.deliveredAt = serverTimestamp();
      }
      
      await updateDoc(orderRef, updateData);

      setOrder(prev => prev ? { ...prev, status: selectedStatus as OrderStatus } : null);
      toast({
        title: "Estado Actualizado",
        description: `El estado del pedido ha sido cambiado a "${selectedStatus}".`,
      });
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!order) {
    return <div className="text-center">No se encontró el pedido.</div>;
  }

  return (
    <div className="grid gap-8 auto-rows-max">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Detalle del Pedido
        </h1>
        <Badge variant="outline" className="ml-auto sm:ml-0">{order.status}</Badge>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle>Pedido #{order.id.substring(0, 7)}</CardTitle>
                  <CardDescription>
                      Fecha: {format(order.createdAt.toDate(), 'dd MMM, yyyy, h:mm a')}
                  </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <Select value={selectedStatus} onValueChange={(value: OrderStatus) => setSelectedStatus(value)} disabled={isUpdating}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Cambiar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Procesando">Procesando</SelectItem>
                      <SelectItem value="Enviado">Enviado</SelectItem>
                      <SelectItem value="Entregado">Entregado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                      <SelectItem value="Reportado">Reportado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleStatusUpdate} disabled={isUpdating || selectedStatus === order.status}>
                    {isUpdating ? <Loader2 className="animate-spin" /> : 'Guardar'}
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="w-5 h-5" />Artículos del Pedido</h3>
                  {order.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                          <Image src={item.image} alt={item.name} width={64} height={80} className="rounded-md object-cover"/>
                          <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">Talla: {item.size}</p>
                              <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-right">S/ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                  ))}
              </div>
            </CardContent>
             <CardFooter className="bg-muted/50 p-6 flex justify-end">
                <div className="flex flex-col items-end gap-2 text-right">
                    <p className="flex justify-between w-48"><span>Subtotal:</span> <span>S/ {order.total.toFixed(2)}</span></p>
                    <p className="flex justify-between w-48"><span>Envío:</span> <span>Gratis</span></p>
                    <Separator className="my-1" />
                    <p className="flex justify-between w-48 font-bold text-lg"><span>Total:</span> <span>S/ {order.total.toFixed(2)}</span></p>
                </div>
            </CardFooter>
          </Card>
        </div>
        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="w-5 h-5"/>Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                            <AvatarImage src={order.customerData?.photoURL} />
                            <AvatarFallback>{order.customerData?.firstName?.[0]}{order.customerData?.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{order.customerData?.firstName} {order.customerData?.lastName}</p>
                            <p className="text-sm text-muted-foreground">{order.customerData?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5"/>Dirección de Envío</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <address className="not-italic">
                        {order.shippingAddress.address}<br />
                        {order.shippingAddress.city}, {order.shippingAddress.department}<br />
                        {order.shippingAddress.zip}
                    </address>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
