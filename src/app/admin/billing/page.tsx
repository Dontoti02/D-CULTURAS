
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';

const invoiceHistory = [
    { id: 'INV-2024-005', date: '1 de Julio, 2024', amount: 49.99, status: 'Pagado' },
    { id: 'INV-2024-004', date: '1 de Junio, 2024', amount: 49.99, status: 'Pagado' },
    { id: 'INV-2024-003', date: '1 de Mayo, 2024', amount: 49.99, status: 'Pagado' },
    { id: 'INV-2024-002', date: '1 de Abril, 2024', amount: 29.99, status: 'Pagado' },
    { id: 'INV-2024-001', date: '1 de Marzo, 2024', amount: 29.99, status: 'Pagado' },
];

export default function BillingPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Facturación y Suscripción</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Actual</CardTitle>
                            <CardDescription>Estás en el plan Profesional. Aquí puedes gestionar tu suscripción.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-lg bg-muted/50 gap-4">
                           <div className="space-y-1">
                                <h3 className="text-2xl font-semibold">Plan Profesional</h3>
                                <p className="text-muted-foreground">S/ 49.99 por mes</p>
                                <p className="text-sm">Tu plan se renueva el 1 de Agosto, 2024.</p>
                           </div>
                           <Button variant="outline">Cambiar de Plan</Button>
                        </CardContent>
                    </Card>

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
