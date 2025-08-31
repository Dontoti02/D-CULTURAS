

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, MoreHorizontal, UserX, CheckCircle, Trash2, Search, UserCheck, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { Customer } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [dialogAction, setDialogAction] = useState<'delete' | 'bulk-delete' | 'bulk-enable' | 'bulk-disable' | null>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "customers"), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const customersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            setCustomers(customersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching customers: ", error);
            toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on component unmount
    }, [toast]);
    
    const filteredCustomers = useMemo(() => {
      return customers.filter(customer =>
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [customers, searchQuery]);
    
    const handleSelectCustomer = (customerId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedCustomers(prev => [...prev, customerId]);
        } else {
            setSelectedCustomers(prev => prev.filter(id => id !== customerId));
        }
    };

    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) {
            setSelectedCustomers(filteredCustomers.map(c => c.id));
        } else {
            setSelectedCustomers([]);
        }
    };
    
    const isAllSelected = filteredCustomers.length > 0 && selectedCustomers.length === filteredCustomers.length;

    const handleToggleStatus = async (customer: Customer) => {
        setIsUpdating(customer.id);
        const newStatus = customer.status === 'active' ? 'inactive' : 'active';
        try {
            const customerRef = doc(db, 'customers', customer.id);
            await updateDoc(customerRef, { status: newStatus });
            toast({
                title: "Estado Actualizado",
                description: `El cliente ${customer.firstName} ha sido ${newStatus === 'active' ? 'habilitado' : 'inhabilitado'}.`,
            });
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({ title: "Error", description: "No se pudo actualizar el estado del cliente.", variant: "destructive" });
        } finally {
            setIsUpdating(null);
        }
    };
    
    const handleBulkToggleStatus = async (status: 'active' | 'inactive') => {
        setIsBulkUpdating(true);
        try {
            const batch = writeBatch(db);
            selectedCustomers.forEach(id => {
                const customerRef = doc(db, 'customers', id);
                batch.update(customerRef, { status });
            });
            await batch.commit();

            toast({ title: "Clientes Actualizados", description: `Se han ${status === 'active' ? 'habilitado' : 'inhabilitado'} ${selectedCustomers.length} clientes.` });
            setSelectedCustomers([]);
        } catch (error) {
            console.error("Error updating statuses: ", error);
            toast({ title: "Error", description: "No se pudo actualizar el estado de los clientes.", variant: "destructive" });
        } finally {
            setIsBulkUpdating(false);
            setDialogAction(null);
        }
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        setIsUpdating(customerToDelete.id);
        try {
            await deleteDoc(doc(db, 'customers', customerToDelete.id));
            toast({
                title: "Cliente Eliminado",
                description: `El cliente ${customerToDelete.firstName} ha sido eliminado de la base de datos.`,
            });
            setCustomerToDelete(null);
        } catch (error) {
            console.error("Error deleting customer: ", error);
            toast({ title: "Error", description: "No se pudo eliminar el cliente.", variant: "destructive" });
        } finally {
            setIsUpdating(null);
            setDialogAction(null);
        }
    };

    const handleBulkDelete = async () => {
        setIsBulkUpdating(true);
        try {
            const batch = writeBatch(db);
            selectedCustomers.forEach(id => {
                const customerRef = doc(db, 'customers', id);
                batch.delete(customerRef);
            });
            await batch.commit();
            
            toast({ title: "Clientes Eliminados", description: `${selectedCustomers.length} clientes han sido eliminados.` });
            setSelectedCustomers([]);
        } catch (error) {
            console.error("Error deleting customers: ", error);
            toast({ title: "Error", description: "No se pudieron eliminar los clientes.", variant: "destructive" });
        } finally {
            setIsBulkUpdating(false);
            setDialogAction(null);
        }
    };


    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Clientes</CardTitle>
                        <CardDescription>Gestiona los usuarios registrados en tu tienda.</CardDescription>
                    </div>
                     <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            placeholder="Buscar por nombre, apellido, correo..." 
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                {selectedCustomers.length > 0 && (
                    <div className="flex items-center gap-2 p-4 border-t">
                        <span className="text-sm text-muted-foreground">{selectedCustomers.length} seleccionados</span>
                        <Button size="sm" variant="outline" onClick={() => setDialogAction('bulk-enable')} disabled={isBulkUpdating}>
                            <UserCheck className="mr-2 h-4 w-4"/> Habilitar
                        </Button>
                         <Button size="sm" variant="outline" onClick={() => setDialogAction('bulk-disable')} disabled={isBulkUpdating}>
                            <UserMinus className="mr-2 h-4 w-4"/> Inhabilitar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDialogAction('bulk-delete')} disabled={isBulkUpdating}>
                            <Trash2 className="mr-2 h-4 w-4"/> Eliminar
                        </Button>
                    </div>
                )}
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                     <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                        aria-label="Seleccionar todo"
                                    />
                                </TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Correo Electrónico</TableHead>
                                <TableHead className="hidden md:table-cell">Fecha de Registro</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} data-state={selectedCustomers.includes(customer.id) && "selected"}>
                                     <TableCell>
                                        <Checkbox
                                            checked={selectedCustomers.includes(customer.id)}
                                            onCheckedChange={(checked) => handleSelectCustomer(customer.id, Boolean(checked))}
                                            aria-label={`Seleccionar ${customer.firstName}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={customer.photoURL} alt="Avatar" />
                                                <AvatarFallback>
                                                    {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <span className={`h-2 w-2 rounded-full ${customer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{customer.isOnline ? 'En línea' : 'Fuera de línea'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {customer.createdAt ? format(customer.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={customer.status === 'active' ? 'default' : 'destructive'}>
                                            {customer.status === 'active' ? 'Activo' : 'Inhabilitado'}
                                        </Badge>
                                    </TableCell>
                                     <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isUpdating === customer.id}>
                                                    {isUpdating === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                                    <span className="sr-only">Menú</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(customer)}>
                                                    {customer.status === 'active' ? <UserX className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                    <span>{customer.status === 'active' ? 'Inhabilitar' : 'Habilitar'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setCustomerToDelete(customer); setDialogAction('delete'); }} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4"/>
                                                    <span>Eliminar</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <AlertDialog open={!!dialogAction} onOpenChange={(open) => !open && setDialogAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>
                        {dialogAction === 'delete' && '¿Estás seguro de eliminar este cliente?'}
                        {dialogAction === 'bulk-delete' && '¿Estás seguro de eliminar los clientes seleccionados?'}
                        {dialogAction === 'bulk-enable' && '¿Estás seguro de habilitar los clientes seleccionados?'}
                        {dialogAction === 'bulk-disable' && '¿Estás seguro de inhabilitar los clientes seleccionados?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                         {dialogAction === 'delete' && `Esta acción no se puede deshacer. Se eliminará al cliente ${customerToDelete?.firstName} ${customerToDelete?.lastName} de la base de datos.`}
                         {dialogAction === 'bulk-delete' && `Se eliminarán permanentemente ${selectedCustomers.length} clientes. Esta acción no se puede deshacer.`}
                         {dialogAction === 'bulk-enable' && `Se habilitará el acceso a la tienda para ${selectedCustomers.length} clientes.`}
                         {dialogAction === 'bulk-disable' && `Se inhabilitará el acceso a la tienda para ${selectedCustomers.length} clientes.`}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isBulkUpdating || !!isUpdating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => {
                            if (dialogAction === 'delete') handleDeleteCustomer();
                            if (dialogAction === 'bulk-delete') handleBulkDelete();
                            if (dialogAction === 'bulk-enable') handleBulkToggleStatus('active');
                            if (dialogAction === 'bulk-disable') handleBulkToggleStatus('inactive');
                        }} 
                        disabled={isBulkUpdating || !!isUpdating} 
                        className={dialogAction?.includes('delete') ? 'bg-destructive hover:bg-destructive/90' : ''}
                    >
                        {(isBulkUpdating || isUpdating) ? <Loader2 className="animate-spin" /> : "Confirmar"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
