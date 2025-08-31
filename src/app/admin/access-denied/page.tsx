
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";


export default function AccessDeniedPage() {
  return (
    <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit">
                   <ShieldAlert className="w-12 h-12 text-destructive" />
                </div>
                <CardTitle className="mt-4 text-2xl">Acceso Denegado</CardTitle>
                <CardDescription>
                    No tienes los permisos necesarios para ver esta página. Por favor, contacta a un superadministrador si crees que esto es un error.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/admin">Volver al Panel Principal</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
