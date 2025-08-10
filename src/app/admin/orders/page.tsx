

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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer, Order, OrderItem } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface EnrichedOrder extends Order {
  customerDetails?: Pick<Customer, 'firstName' | 'lastName' | 'photoURL' | 'email'>;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<EnrichedOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 7;
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
                            photoURL: customerDetails.photoURL,
                            email: customerDetails.email
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

    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;

    const currentOrders = useMemo(() => {
        return orders.slice(indexOfFirstOrder, indexOfLastOrder);
    }, [orders, indexOfFirstOrder, indexOfLastOrder]);

    const totalPages = Math.ceil(orders.length / ordersPerPage);

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
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Productos</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha y Pedido</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentOrders.map((order) => (
                            <TableRow key={order.id} onClick={() => handleRowClick(order.id)} className="cursor-pointer">
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                    {order.items.map((item: OrderItem, index: number) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <Image src={item.image} alt={item.name} width={48} height={64} className="rounded-md object-cover bg-muted" />
                                            <div className='text-sm'>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-muted-foreground">Cant: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </TableCell>
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
                                            <p className="font-medium">{`${order.customerDetails?.firstName || ''} ${order.customerDetails?.lastName || ''}`.trim()}</p>
                                            <p className="text-xs text-muted-foreground">{order.customerDetails?.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p>{order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}</p>
                                    <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 7)}</p>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Mostrando <strong>{Math.min(indexOfFirstOrder + 1, orders.length)}-{Math.min(indexOfLastOrder, orders.length)}</strong> de <strong>{orders.length}</strong> pedidos
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
