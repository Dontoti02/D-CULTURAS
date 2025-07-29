
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Download, ExternalLink, Check, Loader2, MoreHorizontal, Trash2, Star, Plus } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


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
    },
];

interface PaymentMethod {
    id: string;
    brand: 'Visa' | 'Mastercard';
    last4: string;
    expiryMonth: string;
    expiryYear: string;
    isPrimary: boolean;
}

export default function BillingPage() {
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);
    const [isLoadingPlan, setIsLoadingPlan] = useState<string | null>(null);
    const { toast } = useToast();

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        { id: 'pm_1', brand: 'Visa', last4: '4242', expiryMonth: '12', expiryYear: '26', isPrimary: true },
    ]);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [newCard, setNewCard] = useState({ brand: 'Visa' as 'Visa' | 'Mastercard', number: '', expiry: '', cvc: ''});

    const handleSelectPlan = (planName: string) => {
        setIsLoadingPlan(planName);
        setTimeout(() => {
            setCurrentPlan(planName);
            setIsLoadingPlan(null);
            toast({
                title: '¡Plan Activado!',
                description: `Has seleccionado el plan ${planName}.`,
            });
        }, 1500);
    };

    const handleAddCard = (e: React.FormEvent) => {
        e.preventDefault();
        const last4 = newCard.number.slice(-4);
        const [expiryMonth, expiryYear] = newCard.expiry.split('/');
        
        if (!/^\d{16}$/.test(newCard.number) || !/^\d{2}\/\d{2}$/.test(newCard.expiry) || !/^\d{3}$/.test(newCard.cvc)) {
            toast({ title: 'Datos de tarjeta inválidos', description: 'Por favor, revisa los datos de la tarjeta.', variant: 'destructive'});
            return;
        }

        const newPaymentMethod: PaymentMethod = {
            id: `pm_${Date.now()}`,
            brand: newCard.brand,
            last4,
            expiryMonth,
            expiryYear: expiryYear.slice(-2),
            isPrimary: paymentMethods.length === 0,
        };
        
        setPaymentMethods([...paymentMethods, newPaymentMethod]);
        toast({ title: 'Método de pago agregado'});
        setNewCard({ brand: 'Visa', number: '', expiry: '', cvc: ''});
        setIsAddCardOpen(false);
    };
    
    const setPrimaryMethod = (id: string) => {
        setPaymentMethods(paymentMethods.map(pm => ({ ...pm, isPrimary: pm.id === id })));
        toast({ title: 'Método de pago principal actualizado'});
    };

    const removeMethod = (id: string) => {
        setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
        toast({ title: 'Método de pago eliminado'});
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Facturación y Suscripción</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Planes de Suscripción</CardTitle>
                    <CardDescription>Elige el plan que mejor se adapte a las necesidades de tu negocio.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isCurrent = currentPlan === plan.name;
                        const isLoading = isLoadingPlan === plan.name;
                        return (
                             <Card key={plan.name} className={cn("flex flex-col", isCurrent && "border-primary ring-2 ring-primary")}>
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
                                    {isCurrent ? (
                                        <Button disabled className="w-full">Plan Actual</Button>
                                    ) : (
                                        <Button 
                                            variant={currentPlan && !isCurrent ? 'outline' : 'default'} 
                                            className="w-full"
                                            onClick={() => handleSelectPlan(plan.name)}
                                            disabled={!!isLoadingPlan}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="animate-spin" />
                                            ) : 'Seleccionar Plan'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
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
                            {paymentMethods.map((pm) => (
                                <div key={pm.id} className="border rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Image src={pm.brand === 'Visa' ? "/visa-logo.svg" : "/mastercard-logo.svg"} alt={pm.brand} width={36} height={24} />
                                        <div>
                                            <p className="font-semibold">{pm.brand} **** {pm.last4}</p>
                                            <p className="text-sm text-muted-foreground">Expira {pm.expiryMonth}/{pm.expiryYear}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                         {pm.isPrimary && <Badge variant="secondary">Principal</Badge>}
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {!pm.isPrimary && (
                                                    <DropdownMenuItem onClick={() => setPrimaryMethod(pm.id)}>
                                                        <Star className="mr-2 h-4 w-4" />
                                                        Marcar como principal
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => removeMethod(pm.id)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                         </DropdownMenu>
                                    </div>
                                </div>
                            ))}

                            <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full" variant="outline">
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Agregar nuevo método
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Agregar Nueva Tarjeta</DialogTitle>
                                        <DialogDescription>
                                            Ingresa los detalles de tu tarjeta de crédito o débito.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddCard}>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="card-brand">Marca</Label>
                                                <Select value={newCard.brand} onValueChange={(v: 'Visa' | 'Mastercard') => setNewCard({...newCard, brand: v})}>
                                                    <SelectTrigger id="card-brand">
                                                        <SelectValue placeholder="Selecciona una marca" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Visa">Visa</SelectItem>
                                                        <SelectItem value="Mastercard">Mastercard</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="card-number">Número de Tarjeta</Label>
                                                <Input id="card-number" placeholder="0000 0000 0000 0000" value={newCard.number} onChange={(e) => setNewCard({...newCard, number: e.target.value.replace(/\s/g, '')})} maxLength={16} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="card-expiry">Expiración (MM/YY)</Label>
                                                    <Input id="card-expiry" placeholder="MM/YY" value={newCard.expiry} onChange={(e) => setNewCard({...newCard, expiry: e.target.value})} maxLength={5}/>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="card-cvc">CVC</Label>
                                                    <Input id="card-cvc" placeholder="123" value={newCard.cvc} onChange={(e) => setNewCard({...newCard, cvc: e.target.value})} maxLength={3}/>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Agregar Tarjeta</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
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

    