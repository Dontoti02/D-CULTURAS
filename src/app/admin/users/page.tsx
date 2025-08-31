
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
import { Loader2, MoreHorizontal, UserX, CheckCircle, Trash2, PlusCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Admin } from '@/lib/types';
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
import Link from 'next/link';

export default function UsersPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [userToUpdate, setUserToUpdate] = useState<Admin | null>(null);
    const [dialogAction, setDialogAction] = useState<'delete' | 'toggle' | null>(null);


    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "admin"), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const adminsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
        setAdmins(adminsData);
      } catch (error) {
        console.error("Error fetching admins: ", error);
        toast({ title: "Error", description: "No se pudieron cargar los administradores.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchAdmins();
    }, []);
    
    const handleToggleStatus = async () => {
        if (!userToUpdate) return;
        setIsUpdating(userToUpdate.id);
        const newStatus = userToUpdate.status === 'active' ? 'inactive' : 'active';
        try {
            const adminRef = doc(db, 'admin', userToUpdate.id);
            await updateDoc(adminRef, { status: newStatus });
            toast({
                title: "Estado Actualizado",
                description: `El usuario ${userToUpdate.firstName} ha sido ${newStatus === 'active' ? 'habilitado' : 'inhabilitado'}.`,
            });
            await fetchAdmins();
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({ title: "Error", description: "No se pudo actualizar el estado del usuario.", variant: "destructive" });
        } finally {
            setIsUpdating(null);
            setUserToUpdate(null);
            setDialogAction(null);
        }
    };
    
    const handleDeleteUser = async () => {
        if (!userToUpdate) return;
        setIsUpdating(userToUpdate.id);
        try {
            await deleteDoc(doc(db, 'admin', userToUpdate.id));
            toast({
                title: "Usuario Eliminado",
                description: `El usuario ${userToUpdate.firstName} ha sido eliminado.`,
            });
            await fetchAdmins();
        } catch (error) {
            console.error("Error deleting user: ", error);
            toast({ title: "Error", description: "No se pudo eliminar el usuario.", variant: "destructive" });
        } finally {
            setIsUpdating(null);
            setUserToUpdate(null);
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
                        <CardTitle>Usuarios Administradores</CardTitle>
                        <CardDescription>Gestiona los usuarios con acceso al panel de administración.</CardDescription>
                    </div>
                     <Button asChild size="sm">
                        <Link href="/admin/users/new">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Agregar Usuario
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Correo Electrónico</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={admin.photoURL} alt="Avatar" />
                                                <AvatarFallback>
                                                    {admin.firstName?.charAt(0)}{admin.lastName?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={admin.rol === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                            {admin.rol === 'admin' ? <ShieldCheck className="mr-1.5 h-3 w-3" /> : <ShieldAlert className="mr-1.5 h-3 w-3" />}
                                            {admin.rol}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={admin.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                                            {admin.status === 'active' ? 'Activo' : 'Inhabilitado'}
                                        </Badge>
                                    </TableCell>
                                     <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isUpdating === admin.id}>
                                                    {isUpdating === admin.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                                    <span className="sr-only">Menú</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => { setUserToUpdate(admin); setDialogAction('toggle'); }}>
                                                    {admin.status === 'active' ? <UserX className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                    <span>{admin.status === 'active' ? 'Inhabilitar' : 'Habilitar'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setUserToUpdate(admin); setDialogAction('delete'); }} className="text-destructive">
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
                        {dialogAction === 'delete' && '¿Estás seguro de eliminar este usuario?'}
                        {dialogAction === 'toggle' && `¿Estás seguro de ${userToUpdate?.status === 'active' ? 'inhabilitar' : 'habilitar'} este usuario?`}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                         {dialogAction === 'delete' && `Esta acción no se puede deshacer. Se eliminará al usuario ${userToUpdate?.firstName} ${userToUpdate?.lastName}.`}
                         {dialogAction === 'toggle' && `Se ${userToUpdate?.status === 'active' ? 'inhabilitará' : 'habilitará'} el acceso al panel para este usuario.`}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={!!isUpdating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => {
                            if (dialogAction === 'delete') handleDeleteUser();
                            if (dialogAction === 'toggle') handleToggleStatus();
                        }} 
                        disabled={!!isUpdating} 
                        className={dialogAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
                    >
                        {isUpdating ? <Loader2 className="animate-spin" /> : "Confirmar"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
