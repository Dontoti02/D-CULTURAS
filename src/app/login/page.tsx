

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);


  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ title: "Correo requerido", description: "Por favor, ingresa tu correo electrónico.", variant: "destructive" });
        return;
    }
    setIsResetting(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: "Correo Enviado",
            description: "Se ha enviado un enlace para restablecer tu contraseña a tu correo.",
        });
        setIsResetDialogOpen(false);
        setResetEmail('');
    } catch (error: any) {
        console.error("Error al restablecer la contraseña:", error);
        let description = "Ocurrió un error. Inténtalo de nuevo.";
        if (error.code === 'auth/user-not-found') {
            description = "No se encontró ninguna cuenta con este correo electrónico.";
        }
        toast({
            title: "Error",
            description,
            variant: "destructive",
        });
    } finally {
        setIsResetting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Check if user is an admin
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists()) {
          router.push('/admin');
          toast({ title: '¡Bienvenido, Admin!', description: 'Has iniciado sesión correctamente.' });
          return;
        }

        // Check if user is a customer
        const customerDocRef = doc(db, 'customers', user.uid);
        const customerDoc = await getDoc(customerDocRef);
        
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          if (customerData.status === 'inactive') {
            await auth.signOut();
            toast({
              title: 'Cuenta Inhabilitada',
              description: 'Tu cuenta ha sido inhabilitada. Por favor, contacta a soporte.',
              variant: 'destructive',
              duration: 7000,
            });
          } else {
            router.push('/');
            toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente.' });
          }
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
    } catch (error: any) {
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
             console.error("Error de inicio de sesión inesperado:", error);
            errorMessage = `Error: ${error.message}`;
            break;
        }
      } else {
        console.error("Error de inicio de sesión:", error);
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
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                     <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="link" type="button" className="p-0 h-auto text-xs">
                                ¿Olvidaste tu contraseña?
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ingresa tu correo electrónico y te enviaremos un enlace para que puedas restablecer tu contraseña.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid gap-2">
                                <Label htmlFor="reset-email" className="sr-only">Correo electrónico</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    disabled={isResetting}
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePasswordReset} disabled={isResetting}>
                                     {isResetting ? <Loader2 className="animate-spin" /> : 'Enviar Enlace'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
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
            <Link href="/signup" className="text-primary">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
