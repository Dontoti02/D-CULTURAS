
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists()) {
          router.push('/admin');
          toast({ title: '¡Bienvenido, Admin!', description: 'Has iniciado sesión correctamente.' });
        } else {
          // Check if it's a customer
          const customerDocRef = doc(db, 'customers', user.uid);
          const customerDoc = await getDoc(customerDocRef);
          if (customerDoc.exists()) {
            router.push('/');
            toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente.' });
          } else {
             // If user exists in Auth but not in Firestore admins or customers collections
             await auth.signOut();
             toast({
               title: 'Acceso Denegado',
               description: 'Tu cuenta no está registrada como cliente o administrador.',
               variant: 'destructive',
             });
          }
        }
      }
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error);
      let errorMessage = 'Ocurrió un error al intentar iniciar sesión.';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'El correo electrónico o la contraseña son incorrectos.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Error de red. Por favor, comprueba tu conexión a internet.';
            break;
          default:
            errorMessage = `Error: ${error.message}`;
            break;
        }
      }
      toast({
        title: 'Error de inicio de sesión',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo para acceder a tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2 text-left">
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
            <div className="grid gap-2 text-left">
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Iniciar sesión'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="underline text-primary">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
