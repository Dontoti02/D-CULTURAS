
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Admin, ALL_PERMISSIONS, AdminPermission } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';


export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { id } = params;
  const { user: currentUser } = useAuth();


  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'admin' | 'superadmin'>('admin');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<Record<AdminPermission, boolean>>(() => {
    const initialPerms = {} as Record<AdminPermission, boolean>;
    Object.keys(ALL_PERMISSIONS).forEach(key => {
        initialPerms[key as AdminPermission] = false;
    });
    return initialPerms;
  });

  const isEditingSelf = currentUser?.uid === id;
  const isTargetSuperAdmin = rol === 'superadmin';

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'admin', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data() as Admin;
          setFirstName(userData.firstName);
          setLastName(userData.lastName);
          setEmail(userData.email);
          setRol(userData.rol);
          setStatus(userData.status);
          if (userData.permissions) {
             setPermissions(userData.permissions as Record<AdminPermission, boolean>);
          }
        } else {
          toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
          router.push('/admin/users');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({ title: "Error", description: "No se pudo cargar el usuario.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, router, toast]);

  const handlePermissionChange = (permission: AdminPermission, checked: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      toast({ title: 'Campos Incompletos', description: 'Por favor, completa nombre y apellido.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'admin', id as string);
      await updateDoc(userRef, {
        firstName,
        lastName,
        rol,
        status,
        permissions: rol === 'superadmin' ? {} : permissions,
      });
      toast({ title: 'Usuario Actualizado', description: 'Los datos del usuario han sido guardados.' });
      router.push('/admin/users');
    } catch (error) {
      console.error("Error al actualizar el usuario: ", error);
      toast({ title: 'Error al Actualizar', description: 'No se pudo guardar la información.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
             <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
              </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              Editar Usuario
            </h1>
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              <Button variant="outline" size="sm" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
              <Button size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 grid auto-rows-max items-start gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles del Usuario</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-3">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" required value={email} disabled />
                  </div>
                </CardContent>
              </Card>
               <Card>
                  <CardHeader>
                    <CardTitle>Permisos de Acceso</CardTitle>
                    <CardDescription>
                      Selecciona las secciones a las que este usuario tendrá acceso. 
                      Los superadministradores siempre tienen todos los permisos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     {rol === 'admin' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Object.entries(ALL_PERMISSIONS).map(([key, label]) => (
                            <div key={key} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`perm-${key}`} 
                                    checked={permissions[key as AdminPermission]}
                                    onCheckedChange={(checked) => handlePermissionChange(key as AdminPermission, Boolean(checked))}
                                />
                                <label
                                    htmlFor={`perm-${key}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {label}
                                </label>
                            </div>
                        ))}
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground italic">Los superadministradores tienen acceso a todas las secciones.</p>
                     )}
                  </CardContent>
                </Card>
            </div>
             <div className="lg:col-span-1 grid auto-rows-max items-start gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Rol y Estado</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                       <div className="grid gap-3">
                            <Label htmlFor="rol">Rol</Label>
                            <Select 
                              required 
                              onValueChange={(v: 'admin' | 'superadmin') => setRol(v)} 
                              value={rol}
                              disabled={isEditingSelf || isTargetSuperAdmin}
                            >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2"><ShieldAlert /> Admin</div>
                                </SelectItem>
                                <SelectItem value="superadmin">
                                    <div className="flex items-center gap-2"><ShieldCheck /> Superadmin</div>
                                </SelectItem>
                            </SelectContent>
                            </Select>
                            {(isEditingSelf || isTargetSuperAdmin) && (
                                <p className="text-xs text-muted-foreground italic">No puedes cambiar el rol de tu propia cuenta o de un superadmin.</p>
                            )}
                      </div>
                      <div className="grid gap-3">
                            <Label htmlFor="status">Estado</Label>
                            <Select 
                                required 
                                onValueChange={(v: 'active' | 'inactive') => setStatus(v)} 
                                value={status}
                                disabled={isEditingSelf}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                             {isEditingSelf && (
                                <p className="text-xs text-muted-foreground italic">No puedes inhabilitar tu propia cuenta.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
            <Button size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
