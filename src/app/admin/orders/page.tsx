
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
import { Customer, Order } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface EnrichedOrder extends Order {
  customerDetails?: Pick<Customer, 'firstName' | 'lastName' | 'photoURL'>;
}

// Extend jsPDF interface for autoTable plugin
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
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

    const currentOrders = useMemo(() => {
        const indexOfLastOrder = currentPage * ordersPerPage;
        const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
        return orders.slice(indexOfFirstOrder, indexOfLastOrder);
    }, [orders, currentPage, ordersPerPage]);

    const totalPages = Math.ceil(orders.length / ordersPerPage);

    const handleRowClick = (orderId: string) => {
        router.push(`/admin/orders/${orderId}`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Reporte de Pedidos", 14, 16);
        
        const tableColumn = ["ID Pedido", "Cliente", "Fecha", "Total (S/)", "Estado"];
        const tableRows: any[][] = [];

        orders.forEach(order => {
            const orderData = [
                `#${order.id.substring(0, 7)}...`,
                order.customerName,
                order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A',
                order.total.toFixed(2),
                order.status
            ];
            tableRows.push(orderData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("reporte_pedidos.pdf");
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(orders.map(order => ({
            "ID Pedido": order.id,
            "Cliente": order.customerName,
            "Fecha": order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A',
            "Total (S/)": order.total.toFixed(2),
            "Estado": order.status,
            "Descuento Cupón": order.couponDiscount?.toFixed(2) || '0.00',
            "Código Cupón": order.couponCode || 'N/A',
            "Dirección": order.shippingAddress.address,
            "Ciudad": order.shippingAddress.city,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");
        XLSX.writeFile(workbook, "reporte_pedidos.xlsx");
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
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={orders.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar a PDF
                    </Button>
                     <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={orders.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar a Excel
                    </Button>
                </div>
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
                        {currentOrders.map((order) => (
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

