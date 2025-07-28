
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DollarSign, Package, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Customer, Order } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'recharts';
import { format, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
}

interface ChartData {
  date: string;
  [key: string]: number | string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesTimeRange, setSalesTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [customerTimeRange, setCustomerTimeRange] = useState<'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders');

        // 1. Fetch total sales & delivered orders for chart
        const salesQuery = query(ordersRef, where('status', '==', 'Entregado'));
        const salesSnapshot = await getDocs(salesQuery);
        const deliveredOrdersData = salesSnapshot.docs.map(doc => doc.data() as Order);
        setDeliveredOrders(deliveredOrdersData);
        const totalSales = deliveredOrdersData.reduce((acc, doc) => acc + doc.total, 0);

        // 2. Fetch total orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const totalOrders = ordersSnapshot.size;
        
        // 3. Fetch total customers & all customers for chart
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const totalCustomers = customersSnapshot.size;
        const customersData = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        setAllCustomers(customersData);


        setStats({
          totalSales,
          totalOrders,
          totalCustomers,
        });

      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const salesChartData = useMemo(() => {
    if (!deliveredOrders.length) return [];
    
    const now = new Date();
    let startDate: Date;
    let formatStr: string;
    let aggregationUnit: 'day' | 'week' | 'month';

    switch (salesTimeRange) {
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
    
    const aggregatedData: { [key: string]: number } = {};

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

        if (!aggregatedData[key]) {
            aggregatedData[key] = 0;
        }
        aggregatedData[key] += order.total;
    });

    return Object.entries(aggregatedData)
        .map(([dateKey, total]) => ({
            date: format(new Date(dateKey), formatStr),
            Ventas: total,
        }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [deliveredOrders, salesTimeRange]);

  const newCustomersChartData = useMemo(() => {
    if (!allCustomers.length) return [];

    const now = new Date();
    let startDate: Date;
    let formatStr: string;
    let aggregationUnit: 'week' | 'month';

    switch (customerTimeRange) {
      case 'weekly':
        startDate = subDays(now, 90); // Last 90 days for weekly view
        formatStr = 'dd MMM';
        aggregationUnit = 'week';
        break;
      case 'monthly':
      default:
        startDate = subMonths(now, 12); // Last 12 months for monthly view
        formatStr = 'MMM yy';
        aggregationUnit = 'month';
        break;
    }

    const filteredCustomers = allCustomers.filter(customer => customer.createdAt?.toDate() >= startDate);
    
    const aggregatedData: { [key: string]: number } = {};

    filteredCustomers.forEach(customer => {
      if (!customer.createdAt) return;
      const date = customer.createdAt.toDate();
      let key: string;

      if (aggregationUnit === 'week') {
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else { // month
        key = format(startOfMonth(date), 'yyyy-MM-dd');
      }

      if (!aggregatedData[key]) {
        aggregatedData[key] = 0;
      }
      aggregatedData[key]++;
    });

    return Object.entries(aggregatedData)
      .map(([dateKey, total]) => ({
        date: format(new Date(dateKey), formatStr),
        Clientes: total,
      }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
  }, [allCustomers, customerTimeRange]);

  const renderLoadingState = () => (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                </CardContent>
            </Card>
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

  if (loading) {
    return renderLoadingState();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats?.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Basado en pedidos entregados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.totalOrders}</div>
             <p className="text-xs text-muted-foreground">
              Total de pedidos realizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Total de clientes registrados
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
              <div className='flex justify-between items-start'>
                  <div>
                      <CardTitle>Resumen de Ventas</CardTitle>
                      <CardDescription>
                          Un resumen de las ventas brutas de tu tienda.
                      </CardDescription>
                  </div>
                  <Tabs value={salesTimeRange} onValueChange={(value) => setSalesTimeRange(value as any)}>
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
                      data={salesChartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis tickFormatter={(value) => `S/${value}`} fontSize={12} />
                      <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Ventas']}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Ventas" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} dot={false} />
                  </LineChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <div className='flex justify-between items-start'>
                  <div>
                      <CardTitle>Nuevos Clientes</CardTitle>
                      <CardDescription>
                          Un resumen de los nuevos clientes registrados.
                      </CardDescription>
                  </div>
                  <Tabs value={customerTimeRange} onValueChange={(value) => setCustomerTimeRange(value as any)}>
                      <TabsList className="text-xs">
                          <TabsTrigger value="weekly">Semanal</TabsTrigger>
                          <TabsTrigger value="monthly">Mensual</TabsTrigger>
                      </TabsList>
                  </Tabs>
              </div>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newCustomersChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [value, 'Nuevos Clientes']}
                    />
                    <Legend />
                    <Bar dataKey="Clientes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    