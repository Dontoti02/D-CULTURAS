

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Admin, ALL_PERMISSIONS, AdminPermission } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';


export default function NewUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'subadmin' | 'admin'>('subadmin');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<Record<AdminPermission, boolean>>(() => {
    const initialPerms = {} as Record<AdminPermission, boolean>;
    Object.keys(ALL_PERMISSIONS).forEach(key => {
        initialPerms[key as AdminPermission] = true; // Start with all permissions enabled for a new user
    });
    return initialPerms;
  });

  const handlePermissionChange = (permission: AdminPermission, checked: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !rol) {
        toast({
            title: 'Campos Incompletos',
            description: 'Por favor, completa todos los campos requeridos.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        // A more secure approach would use a Cloud Function to create users.
        // This client-side method is for demonstration. It logs out the current admin.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'admin', user.uid), {
            firstName,
            lastName,
            email,
            rol,
            status: 'active',
            photoURL: '',
            createdAt: serverTimestamp(),
            permissions: rol === 'admin' ? {} : permissions,
        } as Omit<Admin, 'id'>);

        toast({
            title: 'Usuario Creado',
            description: `El usuario ${firstName} ${lastName} ha sido creado exitosamente.`,
        });

        // IMPORTANT: Because we used the main `auth` instance, the current admin is now
        // logged out and the new user is logged in. We need to redirect.
        await auth.signOut();
        toast({
            title: "Sesión cerrada",
            description: "Por seguridad, tu sesión ha sido cerrada. Por favor, vuelve a iniciar sesión.",
            duration: 7000,
        });

        router.push('/login');

    } catch (error: any) {
        let description = 'Ocurrió un error inesperado.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'El correo electrónico ya está en uso.';
        } else if (error.code === 'auth/weak-password') {
            description = 'La contraseña debe tener al menos 6 caracteres.';
        }
        console.error("Error creating admin user:", error);
        toast({ title: "Error al Crear Usuario", description, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

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
              Agregar Nuevo Usuario
            </h1>
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              <Button variant="outline" size="sm" onClick={() => router.back()} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Usuario'}
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
                        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-3">
                        <Label htmlFor="password">Contraseña</Label>
                        <div className="relative">
                            <Input 
                                id="password" 
                                type={showPassword ? 'text' : 'password'}
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                   </div>
                </CardContent>
              </Card>
               <Card>
                  <CardHeader>
                    <CardTitle>Permisos de Acceso</CardTitle>
                    <CardDescription>
                      Selecciona las secciones a las que este usuario tendrá acceso. 
                      Los administradores siempre tienen todos los permisos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     {rol === 'subadmin' ? (
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
                        <p className="text-sm text-muted-foreground italic">Los administradores tienen acceso a todas las secciones.</p>
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
                            <Select required onValueChange={(v: 'admin' | 'subadmin') => setRol(v)} value={rol}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2"><ShieldCheck /> Admin</div>
                                </SelectItem>
                                <SelectItem value="subadmin">
                                    <div className="flex items-center gap-2"><ShieldAlert /> Subadmin</div>
                                </SelectItem>
                            </SelectContent>
                            </Select>
                      </div>
                    </CardContent>
                </Card>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" onClick={() => router.back()} disabled={isSubmitting}>Cancelar</Button>
            <Button size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Usuario'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
