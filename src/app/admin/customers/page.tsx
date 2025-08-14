

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
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, MoreHorizontal, UserX, CheckCircle, Trash2 } from 'lucide-react';
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


export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "customers"), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const customersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(customersData);
      } catch (error) {
        console.error("Error fetching customers: ", error);
        toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchCustomers();
    }, []);

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
            await fetchCustomers();
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({ title: "Error", description: "No se pudo actualizar el estado del cliente.", variant: "destructive" });
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        setIsUpdating(customerToDelete.id);
        try {
            // Nota: Esta acción elimina el documento de Firestore, pero no elimina al usuario de Firebase Auth.
            // Para una eliminación completa, se necesitaría una Cloud Function que maneje la eliminación en Auth.
            await deleteDoc(doc(db, 'customers', customerToDelete.id));
            toast({
                title: "Cliente Eliminado",
                description: `El cliente ${customerToDelete.firstName} ha sido eliminado de la base de datos.`,
            });
            setCustomerToDelete(null);
            await fetchCustomers();
        } catch (error) {
            console.error("Error deleting customer: ", error);
            toast({ title: "Error", description: "No se pudo eliminar el cliente.", variant: "destructive" });
        } finally {
            setIsUpdating(null);
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
                <CardHeader>
                    <CardTitle>Clientes</CardTitle>
                    <CardDescription>Gestiona los usuarios registrados en tu tienda.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Correo Electrónico</TableHead>
                                <TableHead className="hidden md:table-cell">Fecha de Registro</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={customer.photoURL} alt="Avatar" />
                                                <AvatarFallback>
                                                    {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                <p className="font-medium">{customer.firstName} {customer.lastName}</p>
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
                                                <DropdownMenuItem onClick={() => setCustomerToDelete(customer)} className="text-destructive">
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
            <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará al cliente 
                        <span className="font-semibold"> {customerToDelete?.firstName} {customerToDelete?.lastName} </span>
                        de la base de datos.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={!!isUpdating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCustomer} disabled={!!isUpdating} className="bg-destructive hover:bg-destructive/90">
                        {isUpdating === customerToDelete?.id ? <Loader2 className="animate-spin" /> : "Confirmar Eliminación"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
