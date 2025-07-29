
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Download, ExternalLink, Check } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';


const invoiceHistory = [
    { id: 'INV-2024-005', date: '1 de Julio, 2024', amount: 49.99, status: 'Pagado' },
    { id: 'INV-2024-004', date: '1 de Junio, 2024', amount: 49.99, status: 'Pagado' },
    { id: 'INV-2024-003', date: '1 de Mayo, 2024', amount: 49.99, status: 'Pagado' },
    { id: 'INV-2024-002', date: '1 de Abril, 2024', amount: 29.99, status: 'Pagado' },
    { id: 'INV-2024-001', date: '1 de Marzo, 2024', amount: 29.99, status: 'Pagado' },
];

const plans = [
    {
        name: 'Básico',
        price: '29.99',
        description: 'Ideal para empezar y para tiendas pequeñas.',
        features: [
            'Gestión de hasta 50 productos',
            'Análisis básico de ventas',
            'Soporte por correo electrónico',
            '1 cuenta de administrador',
        ],
        isCurrent: false,
    },
    {
        name: 'Intermedio',
        price: '79.99',
        description: 'Perfecto para negocios en crecimiento.',
        features: [
            'Gestión de hasta 500 productos',
            'Análisis de ventas y clientes',
            'Herramientas de marketing (cupones)',
            'Soporte prioritario por chat',
            'Hasta 3 cuentas de administrador',
        ],
        isCurrent: false,
    },
    {
        name: 'Profesional',
        price: '149.99',
        description: 'La solución completa para escalar tu negocio.',
        features: [
            'Gestión de productos ilimitados',
            'Análisis avanzado y reportes financieros',
            'API de integración para sistemas externos',
            'Soporte dedicado 24/7',
            'Cuentas de administrador ilimitadas',
        ],
        isCurrent: true,
    },
]

export default function BillingPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Facturación y Suscripción</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Planes de Suscripción</CardTitle>
                    <CardDescription>Elige el plan que mejor se adapte a las necesidades de tu negocio.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <Card key={plan.name} className={cn("flex flex-col", plan.isCurrent && "border-primary ring-2 ring-primary")}>
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <p className="text-4xl font-bold">
                                    S/ {plan.price}
                                    <span className="text-sm font-normal text-muted-foreground">/mes</span>
                                </p>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <ul className="space-y-2 text-sm">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-primary" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {plan.isCurrent ? (
                                    <Button disabled className="w-full">Plan Actual</Button>
                                ) : (
                                    <Button variant="outline" className="w-full">Cambiar de Plan</Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Historial de Facturación</CardTitle>
                            <CardDescription>Revisa y descarga tus facturas anteriores.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Factura</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead><span className="sr-only">Descargar</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoiceHistory.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-mono">{invoice.id}</TableCell>
                                            <TableCell>{invoice.date}</TableCell>
                                            <TableCell>S/ {invoice.amount.toFixed(2)}</TableCell>
                                            <TableCell><Badge variant="outline">{invoice.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Método de Pago</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                     <Image src="/visa-logo.svg" alt="Visa" width={48} height={30} />
                                     <div>
                                        <p className="font-semibold">Visa **** 4242</p>
                                        <p className="text-sm text-muted-foreground">Expira 12/26</p>
                                     </div>
                                </div>
                                <Badge variant="secondary">Primario</Badge>
                            </div>
                            <Button className="w-full">
                                <CreditCard className="mr-2 h-4 w-4"/>
                                Agregar nuevo método
                            </Button>
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">
                                Utilizamos Stripe para un procesamiento de pagos seguro. Tu información está encriptada y protegida.
                                <a href="#" className="ml-1 text-primary hover:underline">Saber más <ExternalLink className="inline h-3 w-3"/></a>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
