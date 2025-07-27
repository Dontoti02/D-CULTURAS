
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || '');
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setPhotoURL(data.photoURL || '');
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const adminDocRef = doc(db, 'admins', user.uid);
      await updateDoc(adminDocRef, { firstName, lastName, photoURL });
      toast({
        title: 'Perfil Actualizado',
        description: 'Tu información personal se ha guardado correctamente.',
      });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar tu perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentPassword || !newPassword) return;
    if (newPassword !== confirmNewPassword) {
        toast({ title: 'Error', description: 'Las contraseñas nuevas no coinciden.', variant: 'destructive' });
        return;
    }

    setIsPasswordSubmitting(true);

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        
        toast({
            title: 'Contraseña Actualizada',
            description: 'Tu contraseña ha sido cambiada exitosamente.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    } catch (error: any) {
        console.error("Error updating password: ", error);
        let description = 'Ocurrió un error al cambiar la contraseña.';
        if (error.code === 'auth/wrong-password') {
            description = 'La contraseña actual es incorrecta.';
        }
        toast({
            title: 'Error al cambiar contraseña',
            description,
            variant: 'destructive',
        });
    } finally {
        setIsPasswordSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'profiles_images'); 
    formData.append('cloud_name', 'dd7fku9br');
    formData.append('folder', 'avatars');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dd7fku9br/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPhotoURL(data.secure_url);
        if (user) {
            const adminDocRef = doc(db, 'admins', user.uid);
            await updateDoc(adminDocRef, { photoURL: data.secure_url });
        }
        toast({
          title: 'Imagen Subida',
          description: 'Tu foto de perfil ha sido actualizada.',
        });
      } else {
        throw new Error('Error al subir la imagen');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Ajustes de Cuenta</h1>

        <Card>
            <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tu foto de perfil y detalles personales.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={photoURL} alt="Foto de perfil" />
                            <AvatarFallback>{firstName.charAt(0)}{lastName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Label htmlFor="photo-upload" className="absolute bottom-0 right-0 flex items-center justify-center h-8 w-8 bg-primary rounded-full cursor-pointer hover:bg-primary/90">
                           {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" /> : <Camera className="h-5 w-5 text-primary-foreground" />}
                           <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        </Label>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Sube una nueva foto de perfil. <br/> Recomendado: 200x200px
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" value={email} disabled readOnly />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || isUploading}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>Asegúrate de usar una contraseña segura.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                    <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                </div>
                 <div className="flex justify-end">
                    <Button type="submit" disabled={isPasswordSubmitting}>
                        {isPasswordSubmitting ? <Loader2 className="animate-spin" /> : 'Actualizar Contraseña'}
                    </Button>
                </div>
            </form>
            </CardContent>
        </Card>
    </div>
  );
}
