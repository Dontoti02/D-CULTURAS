
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer, Order } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

interface EnrichedOrder extends Order {
  customerDetails?: Pick<Customer, 'firstName' | 'lastName' | 'photoURL'>;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<EnrichedOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchOrdersAndCustomers = async () => {
            setLoading(true);
            try {
                // 1. Fetch all customers and create a map
                const customerSnapshot = await getDocs(collection(db, 'customers'));
                const customerMap = new Map<string, Customer>();
                customerSnapshot.forEach(doc => {
                    customerMap.set(doc.id, { id: doc.id, ...doc.data() } as Customer);
                });

                // 2. Fetch all orders
                const ordersRef = collection(db, 'orders');
                const q = query(ordersRef, orderBy('createdAt', 'desc'));
                const orderSnapshot = await getDocs(q);

                // 3. Enrich orders with customer details
                const enrichedOrdersData = orderSnapshot.docs.map(doc => {
                    const orderData = { id: doc.id, ...doc.data() } as Order;
                    const customerDetails = customerMap.get(orderData.customerId);
                    return {
                        ...orderData,
                        customerDetails: customerDetails ? {
                            firstName: customerDetails.firstName,
                            lastName: customerDetails.lastName,
                            photoURL: customerDetails.photoURL
                        } : undefined
                    };
                });

                setOrders(enrichedOrdersData);
            } catch (error) {
                console.error("Error fetching orders: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrdersAndCustomers();
    }, []);

    const handleRowClick = (orderId: string) => {
        router.push(`/admin/orders/${orderId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Pedido</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="hidden md:table-cell">Fecha</TableHead>
                            <TableHead className="hidden md:table-cell">Total</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id} onClick={() => handleRowClick(order.id)} className="cursor-pointer">
                                <TableCell className="font-mono text-xs">#{order.id.substring(0, 7)}...</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={order.customerDetails?.photoURL} alt="Avatar" />
                                            <AvatarFallback>
                                                {order.customerDetails?.firstName?.charAt(0)}
                                                {order.customerDetails?.lastName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <p className="font-medium">{order.customerName}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell className="hidden md:table-cell font-semibold">S/ {order.total.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        order.status === 'Enviado' ? 'secondary' : 
                                        order.status === 'Procesando' ? 'default' :
                                        order.status === 'Entregado' ? 'outline' : 'destructive'
                                    }>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
