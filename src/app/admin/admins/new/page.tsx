

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function NewAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'Admin' | 'Ayudante'>('Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRol('Admin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !rol) {
      toast({
        title: 'Campos Incompletos',
        description: 'Por favor, rellena todos los campos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Create admin document in Firestore
      await setDoc(doc(db, 'admins', user.uid), {
        firstName,
        lastName,
        email,
        rol,
        photoURL: '', // Initialize with an empty photo URL
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Administrador Agregado',
        description: 'El nuevo administrador ha sido creado y guardado correctamente.',
      });
      resetForm(); // Reset form for next entry
      // Opcional: Redirigir a la lista de administradores
      router.push('/admin/admins');
    } catch (error: any) {
      console.error("Error al crear administrador: ", error);
      let description = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este correo electrónico ya está en uso por otra cuenta.';
      } else if (error.code === 'auth/weak-password') {
        description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'El formato del correo electrónico no es válido.';
      }
      
      toast({
        title: 'Error al Crear Administrador',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Registro de Administrador</CardTitle>
                <CardDescription>
                Ingresa la información para el nuevo administrador.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input
                            id="firstName"
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input
                            id="lastName"
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="grid gap-3">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                    />
                    </div>
                    <div className="grid gap-3">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                    />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="rol">Rol</Label>
                        <Select required onValueChange={(value: 'Admin' | 'Ayudante') => setRol(value)} value={rol} disabled={isSubmitting}>
                            <SelectTrigger id="rol" aria-label="Seleccionar rol">
                            <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Ayudante">Ayudante</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <Button size="lg" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Registrar Administrador'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
