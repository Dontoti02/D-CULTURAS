import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$12,345.67</p>
            <p className="text-sm text-muted-foreground">+5.2% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-sm text-muted-foreground">+12.1% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nuevos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">56</p>
            <p className="text-sm text-muted-foreground">+8.9% desde el mes pasado</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
