
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { sendWelcomeEmail } from '@/ai/flows/send-email-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateWelcomePromotion } from '@/ai/flows/promote-by-gender-flow';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'Damas' | 'Caballeros' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword || !gender) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, rellena todos los campos.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Las contraseñas no coinciden',
        description: 'Por favor, asegúrate de que ambas contraseñas sean iguales.',
        variant: 'destructive',
      });
      return;
    }


    setIsLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save user data to Firestore
      await setDoc(doc(db, 'customers', user.uid), {
        firstName,
        lastName,
        email,
        gender,
        photoURL: '', // Initialize with an empty photo URL
        status: 'active', // Default status for new users
        createdAt: serverTimestamp(),
      });
      
      // 3. Send welcome email (fire-and-forget)
      try {
        await sendWelcomeEmail({
          to: email,
          customerName: firstName,
        });
      } catch (emailError) {
          // Log the error, but don't block the user flow
          console.error("Failed to send welcome email:", emailError);
      }
      
      // 4. Trigger AI promotion flow in the background
      try {
        generateWelcomePromotion({ customerId: user.uid });
      } catch (aiError) {
          // Also log this but don't block
          console.error("Failed to trigger welcome promotion AI flow:", aiError);
      }

      toast({
        title: '¡Cuenta Creada!',
        description: 'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
      });
      router.push('/login');

    } catch (error: any) {
      console.error("Error al registrarse: ", error);
      let description = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este correo electrónico ya está en uso por otra cuenta.';
        // Limpiar campos para que el usuario pueda corregir
        setEmail('');
        setPassword('');
      } else if (error.code === 'auth/weak-password') {
        description = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
        setPassword('');
      } else if (error.code === 'auth/invalid-email') {
        description = 'El formato del correo electrónico no es válido.';
      }
      
      toast({
        title: 'Error de Registro',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>Ingresa tu información para crear una cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">Nombre</Label>
                <Input 
                  id="first-name" 
                  placeholder="Max" 
                  required 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Apellido</Label>
                <Input 
                  id="last-name" 
                  placeholder="Robinson" 
                  required 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@ejemplo.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="gender">Género</Label>
                <Select required onValueChange={(value: 'Damas' | 'Caballeros') => setGender(value)} value={gender} disabled={isLoading}>
                  <SelectTrigger id="gender" aria-label="Seleccionar género">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Damas">Dama</SelectItem>
                    <SelectItem value="Caballeros">Caballero</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
               <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={isLoading}
                  className="pr-10"
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
             <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <div className="relative">
                <Input 
                  id="confirm-password" 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  disabled={isLoading}
                  className="pr-10"
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Crear una cuenta'}
            </Button>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="underline text-primary">
                Iniciar sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
