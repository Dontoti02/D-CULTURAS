
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Loader2, Percent } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

function SuccessPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');
    const { user, loading: authLoading } = useAuth();
    
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (!orderId) {
            setError("No se proporcionó un ID de pedido.");
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'orders', orderId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
                    // Security check: ensure the fetched order belongs to the current user
                    if (orderData.customerId !== user.uid) {
                        setError("No tienes permiso para ver este pedido.");
                    } else {
                        setOrder(orderData);
                    }
                } else {
                    setError("El pedido no fue encontrado.");
                }
            } catch (err) {
                console.error("Error al obtener el pedido:", err);
                setError("Ocurrió un error al cargar los detalles de tu pedido.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();

    }, [orderId, user, authLoading, router]);

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <h1 className="text-2xl font-bold">Cargando tu confirmación...</h1>
            </div>
        );
    }

     if (error) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="items-center text-center">
                    <CardTitle className="text-2xl text-destructive">Error</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Button asChild>
                        <Link href="/profile/orders">Ver mis Pedidos</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    if (!order) {
        return null; // Should be covered by error state
    }
    
    return (
         <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="items-center text-center p-6">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <CardTitle className="text-3xl">¡Gracias por tu compra!</CardTitle>
                <CardDescription>Tu pedido ha sido realizado con éxito.</CardDescription>
                <p className="text-sm text-muted-foreground pt-2">
                    ID del Pedido: <span className="font-mono">#{order.id}</span>
                </p>
            </CardHeader>
            <CardContent className="p-6">
                <Separator className="mb-6" />
                <div className="space-y-4">
                    {order.items.map((item, index) => (
                         <div key={index} className="flex items-center gap-4 text-sm">
                            <Image src={item.image} alt={item.name} width={64} height={80} className="rounded-md object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.name}</p>
                                <p className="text-muted-foreground">Cant: {item.quantity} | Talla: {item.size}</p>
                            </div>
                            <p className="font-semibold">S/ {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
                <Separator className="my-6" />
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">S/ {order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                         <div className="flex justify-between text-destructive">
                            <span className="flex items-center gap-1 text-sm">
                                <Percent className="w-4 h-4" /> 
                                Descuento (50%)
                            </span>
                            <span className="font-semibold">- S/ {order.discount.toFixed(2)}</span>
                        </div>
                    )}
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Envío</span>
                        <span className="font-semibold">Gratis</span>
                    </div>
                     <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>S/ {order.total.toFixed(2)}</span>
                    </div>
                </div>
                 <Separator className="my-6" />
                 <div className="grid md:grid-cols-2 gap-4 text-sm">
                     <div>
                        <h3 className="font-semibold mb-2">Dirección de Envío</h3>
                        <div className="text-muted-foreground">
                            <p>{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.department}</p>
                            <p>{order.shippingAddress.zip}</p>
                        </div>
                     </div>
                      <div>
                        <h3 className="font-semibold mb-2">Resumen</h3>
                        <div className="text-muted-foreground">
                            <p><strong>Fecha del pedido:</strong> {format(order.createdAt.toDate(), 'dd/MM/yyyy')}</p>
                             <p><strong>Estado del pedido:</strong> <span className="text-primary font-medium">{order.status}</span></p>
                        </div>
                     </div>
                 </div>
                 <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
                    <Button asChild>
                        <Link href="/">Seguir Comprando</Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/profile/orders">Ir a Mis Pedidos</Link>
                    </Button>
                 </div>
            </CardContent>
        </Card>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <SuccessPageContent />
        </Suspense>
    );
}
