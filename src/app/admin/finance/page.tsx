
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DollarSign, Percent, TrendingUp, Landmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Order, Product } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface FinanceStats {
  totalRevenue: number;
  grossProfit: number;
  profitMargin: number;
  avgOrderValue: number;
}

interface EnrichedOrderItem extends OrderItem {
  cost?: number;
}
interface EnrichedOrder extends Order {
  items: EnrichedOrderItem[];
}


export default function FinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [deliveredOrders, setDeliveredOrders] = useState<EnrichedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [transactionsCurrentPage, setTransactionsCurrentPage] = useState(1);
  const transactionsPerPage = 5;

  useEffect(() => {
    const fetchFinanceData = async () => {
      setLoading(true);
      try {
        const productSnapshot = await getDocs(collection(db, 'products'));
        const productsMap = new Map<string, Product>();
        productSnapshot.forEach(doc => {
            productsMap.set(doc.id, { id: doc.id, ...doc.data() } as Product);
        });

        const ordersQuery = query(collection(db, 'orders'), where('status', '==', 'Entregado'), orderBy('createdAt', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const ordersData = ordersSnapshot.docs.map(doc => {
            const order = { id: doc.id, ...doc.data() } as Order;
            const enrichedItems = order.items.map(item => {
                const product = productsMap.get(item.productId);
                return { ...item, cost: product?.cost || 0 };
            });
            return { ...order, items: enrichedItems };
        }) as EnrichedOrder[];

        setDeliveredOrders(ordersData);

        const totalRevenue = ordersData.reduce((acc, order) => acc + order.total, 0);
        
        const totalCost = ordersData.reduce((orderAcc, order) => {
            const orderCost = order.items.reduce((itemAcc, item) => itemAcc + (item.cost || 0) * item.quantity, 0);
            return orderAcc + orderCost;
        }, 0);

        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const avgOrderValue = ordersData.length > 0 ? totalRevenue / ordersData.length : 0;

        setStats({
          totalRevenue,
          grossProfit,
          profitMargin,
          avgOrderValue,
        });

      } catch (error) {
        console.error("Error fetching finance data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  const chartData = useMemo(() => {
    if (!deliveredOrders.length) return [];
    
    const now = new Date();
    let startDate: Date;
    let formatStr: string;
    let aggregationUnit: 'day' | 'week' | 'month';

    switch (timeRange) {
        case 'daily':
            startDate = subDays(now, 30);
            formatStr = 'dd MMM';
            aggregationUnit = 'day';
            break;
        case 'weekly':
            startDate = subDays(now, 90);
            formatStr = 'dd MMM';
            aggregationUnit = 'week';
            break;
        case 'monthly':
        default:
            startDate = subDays(now, 365);
            formatStr = 'MMM yy';
            aggregationUnit = 'month';
            break;
    }

    const filteredOrders = deliveredOrders.filter(order => order.createdAt.toDate() >= startDate);
    
    const aggregatedData: { [key: string]: { revenue: number, profit: number } } = {};

    filteredOrders.forEach(order => {
        const date = order.createdAt.toDate();
        let key: string;

        if (aggregationUnit === 'day') {
             key = format(date, 'yyyy-MM-dd');
        } else if (aggregationUnit === 'week') {
            key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        } else { // month
            key = format(startOfMonth(date), 'yyyy-MM-dd');
        }
        
        const orderCost = order.items.reduce((acc, item) => acc + (item.cost || 0) * item.quantity, 0);
        const orderProfit = order.total - orderCost;
        
        if (!aggregatedData[key]) {
            aggregatedData[key] = { revenue: 0, profit: 0 };
        }
        aggregatedData[key].revenue += order.total;
        aggregatedData[key].profit += orderProfit;
    });

    return Object.entries(aggregatedData)
        .map(([dateKey, data]) => ({
            date: format(new Date(dateKey), formatStr),
            Ingresos: data.revenue,
            Ganancias: data.profit,
        }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [deliveredOrders, timeRange]);

  const categoryPerformance = useMemo(() => {
    const data: { [key: string]: { revenue: number, profit: number } } = {};

    deliveredOrders.forEach(order => {
        order.items.forEach(item => {
            const productCategory = (item as any).category || 'Sin Categoría';
             if (!data[productCategory]) {
                data[productCategory] = { revenue: 0, profit: 0 };
            }
            const itemRevenue = item.price * item.quantity;
            const itemCost = (item.cost || 0) * item.quantity;
            data[productCategory].revenue += itemRevenue;
            data[productCategory].profit += (itemRevenue - itemCost);
        });
    });

    return Object.entries(data).map(([name, values]) => ({ name, ...values }));
  }, [deliveredOrders]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (transactionsCurrentPage - 1) * transactionsPerPage;
    return deliveredOrders.slice(startIndex, startIndex + transactionsPerPage);
  }, [deliveredOrders, transactionsCurrentPage, transactionsPerPage]);

  const totalTransactionPages = Math.ceil(deliveredOrders.length / transactionsPerPage);


  if (loading) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Panel de Finanzas</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({length: 4}).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>
             <div className="mt-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-64 mt-1" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="w-full h-[350px]" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Finanzas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats?.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Basado en pedidos entregados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats?.grossProfit.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">
              Ingresos menos costo de productos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen de Ganancia</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.profitMargin.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              ((Ingresos - Costos) / Ingresos) * 100
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Promedio de Pedido</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats?.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ingreso total / Número de pedidos
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
              <div className='flex justify-between items-start'>
                  <div>
                      <CardTitle>Rendimiento Financiero</CardTitle>
                      <CardDescription>
                          Un resumen de las ganancias e ingresos brutos de tu tienda.
                      </CardDescription>
                  </div>
                  <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
                      <TabsList className="text-xs">
                          <TabsTrigger value="daily">Diario</TabsTrigger>
                          <TabsTrigger value="weekly">Semanal</TabsTrigger>
                          <TabsTrigger value="monthly">Mensual</TabsTrigger>
                      </TabsList>
                  </Tabs>
              </div>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis tickFormatter={(value) => `S/${value}`} fontSize={12} />
                      <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          formatter={(value: number, name: string) => [`S/ ${value.toFixed(2)}`, name]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Ingresos" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} dot={false} />
                      <Line type="monotone" dataKey="Ganancias" stroke="hsl(var(--primary) / 0.5)" strokeWidth={2} activeDot={{ r: 8 }} dot={false} />
                  </LineChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Categoría</CardTitle>
              <CardDescription>Ingresos y ganancias por cada categoría de producto.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `S/${value}`} fontSize={12} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number, name: string) => [`S/ ${value.toFixed(2)}`, name]}
                    />
                    <Legend />
                    <Bar dataKey="Ingresos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Ganancias" fill="hsl(var(--primary) / 0.5)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
           <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
                <CardDescription>Últimos pedidos que han sido entregados.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Costo</TableHead>
                            <TableHead>Ganancia</TableHead>
                            <TableHead>Margen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedTransactions.map((order) => {
                            const orderCost = order.items.reduce((acc, item) => acc + (item.cost || 0) * item.quantity, 0);
                            const orderProfit = order.total - orderCost;
                            const profitMargin = order.total > 0 ? (orderProfit / order.total) * 100 : 0;
                            return (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <p className="font-mono text-xs">#{order.id.slice(0, 7)}</p>
                                        <p className="text-xs text-muted-foreground">{format(order.createdAt.toDate(), 'dd/MM/yy')}</p>
                                    </TableCell>
                                    <TableCell>S/ {order.total.toFixed(2)}</TableCell>
                                    <TableCell>S/ {orderCost.toFixed(2)}</TableCell>
                                    <TableCell className="text-green-600">S/ {orderProfit.toFixed(2)}</TableCell>
                                    <TableCell className="text-green-600">{profitMargin.toFixed(1)}%</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                 <div className="text-xs text-muted-foreground">
                    Página <strong>{transactionsCurrentPage}</strong> de <strong>{totalTransactionPages}</strong>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionsCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={transactionsCurrentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionsCurrentPage(prev => Math.min(prev + 1, totalTransactionPages))}
                        disabled={transactionsCurrentPage === totalTransactionPages}
                    >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
        </div>
    </div>
  );
}

    