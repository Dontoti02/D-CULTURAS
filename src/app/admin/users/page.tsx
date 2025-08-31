

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
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Loader2, PlusCircle, ShieldCheck, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { Admin } from '@/lib/types';
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
import { useRouter } from 'next/navigation';

export default function UsersPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Admin | null>(null);
    const router = useRouter();


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
    
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        
        // Safety check: Don't delete the currently logged-in user or an admin
        if (userToDelete.id === auth.currentUser?.uid) {
            toast({ title: "Acción no permitida", description: "No puedes eliminar tu propia cuenta.", variant: "destructive" });
            setUserToDelete(null);
            return;
        }
         if (userToDelete.rol === 'admin') {
            toast({ title: "Acción no permitida", description: "No se puede eliminar a un administrador principal.", variant: "destructive" });
            setUserToDelete(null);
            return;
        }

        setIsDeleting(true);
        try {
            // Note: This only deletes the Firestore record. The user still exists in Firebase Auth.
            // A production app would use a Cloud Function to delete the user from Auth.
            await deleteDoc(doc(db, 'admin', userToDelete.id));
            toast({
                title: "Usuario Eliminado",
                description: `El usuario ${userToDelete.firstName} ha sido eliminado de la lista de administradores.`,
            });
            await fetchAdmins();
        } catch (error) {
            console.error("Error deleting user: ", error);
            toast({ title: "Error", description: "No se pudo eliminar el usuario.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
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
                                            {admin.rol === 'admin' ? 'Admin' : 'Subadmin'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={admin.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                                            {admin.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                     <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/edit/${admin.id}`)}>
                                                <Edit className="mr-2 h-3 w-3" />
                                                Editar
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                onClick={() => setUserToDelete(admin)}
                                                disabled={isDeleting || admin.rol === 'admin'}
                                            >
                                                <Trash2 className="mr-2 h-3 w-3" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de eliminar este usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará al usuario <span className="font-bold">{userToDelete?.firstName} {userToDelete?.lastName}</span> del panel. 
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteUser} 
                            disabled={isDeleting} 
                            className={'bg-destructive hover:bg-destructive/90'}
                        >
                            {isDeleting ? <Loader2 className="animate-spin" /> : "Confirmar Eliminación"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
