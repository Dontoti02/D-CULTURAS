
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">Contáctanos</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          ¿Tienes alguna pregunta o comentario? Nos encantaría saber de ti.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Formulario de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Envíanos un Mensaje</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Tu nombre completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea id="message" placeholder="Escribe tu mensaje aquí..." className="min-h-[150px]" />
              </div>
              <Button type="submit" className="w-full">Enviar Mensaje</Button>
            </form>
          </CardContent>
        </Card>

        {/* Información de Contacto */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <div className="flex items-start gap-4">
                        <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-foreground">Email</h3>
                            <a href="mailto:soporte@stylesup.com" className="hover:text-primary">soporte@stylesup.com</a>
                            <p className="text-sm">Te responderemos en 24 horas hábiles.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-foreground">Teléfono</h3>
                            <a href="tel:+51987654321" className="hover:text-primary">+51 987 654 321</a>
                            <p className="text-sm">Lunes a Viernes, 9am - 6pm.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-foreground">Oficina</h3>
                            <p>Av. Principal 123, Miraflores</p>
                            <p>Lima, Perú</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image 
                    src="https://placehold.co/600x400.png" 
                    alt="Ubicación en mapa" 
                    fill
                    className="object-cover"
                    data-ai-hint="map location"
                />
            </div>
        </div>
      </div>
    </div>
  );
}
