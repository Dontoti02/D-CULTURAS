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

const orders = [
  {
    id: 'ORD001',
    customer: 'Juan Pérez',
    date: '2023-05-01',
    total: '$150.00',
    status: 'Enviado',
  },
  {
    id: 'ORD002',
    customer: 'Maria García',
    date: '2023-05-02',
    total: '$75.50',
    status: 'Procesando',
  },
  {
    id: 'ORD003',
    customer: 'Carlos Sanchez',
    date: '2023-05-03',
    total: '$220.00',
    status: 'Entregado',
  },
  {
    id: 'ORD004',
    customer: 'Laura Martinez',
    date: '2023-05-04',
    total: '$50.00',
    status: 'Cancelado',
  },
];


export default function OrdersPage() {
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
                            <TableHead>Fecha</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>{order.customer}</TableCell>
                                <TableCell>{order.date}</TableCell>
                                <TableCell>{order.total}</TableCell>
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
    )
}
