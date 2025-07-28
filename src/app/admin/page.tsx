
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DollarSign, Package, Users, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch total sales from delivered orders
        const ordersRef = collection(db, 'orders');
        const salesQuery = query(ordersRef, where('status', '==', 'Entregado'));
        const salesSnapshot = await getDocs(salesQuery);
        const totalSales = salesSnapshot.docs.reduce((acc, doc) => acc + doc.data().total, 0);

        // 2. Fetch total orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const totalOrders = ordersSnapshot.size;
        
        // 3. Fetch total customers
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const totalCustomers = customersSnapshot.size;

        setStats({
          totalSales,
          totalOrders,
          totalCustomers,
        });

      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
        // Handle error, maybe show a toast
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  if (loading) {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
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
        </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
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
    </div>
  );
}
