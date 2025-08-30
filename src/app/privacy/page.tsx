
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">Política de Privacidad</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Tu privacidad es importante para nosotros.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Lock className="w-8 h-8 text-primary"/>
            Nuestro Compromiso con la Privacidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
            <p>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Esta política de privacidad explica cómo nuestra tienda recopila, utiliza y divulga tu información personal en relación con la operación de nuestra tienda en línea.</p>
            
            <h3 className="font-semibold text-lg text-foreground pt-4">1. Información que Recopilamos</h3>
            <p>Recopilamos varios tipos de información, incluyendo:</p>
            <ul className="list-disc list-inside pl-4">
                <li><strong>Información que nos proporcionas directamente:</strong> como tu nombre, dirección de correo electrónico, dirección de envío e información de pago cuando creas una cuenta o realizas un pedido.</li>
                <li><strong>Información sobre tu uso de nuestros servicios:</strong> como los productos que ves, los artículos que agregas al carrito y tu historial de compras.</li>
                <li><strong>Información técnica:</strong> como tu dirección IP, tipo de navegador e información del dispositivo.</li>
            </ul>

            <h3 className="font-semibold text-lg text-foreground pt-4">2. Cómo Usamos tu Información</h3>
            <p>Utilizamos la información que recopilamos para:</p>
            <ul className="list-disc list-inside pl-4">
                <li>Procesar y completar tus pedidos.</li>
                <li>Comunicarnos contigo sobre tu cuenta y pedidos.</li>
                <li>Personalizar y mejorar tu experiencia de compra.</li>
                <li>Para fines de marketing, con tu consentimiento.</li>
            </ul>

             <h3 className="font-semibold text-lg text-foreground pt-4">3. Cómo Compartimos tu Información</h3>
            <p>No vendemos tu información personal a terceros. Podemos compartir tu información con proveedores de servicios de confianza que nos ayudan a operar nuestro negocio, como procesadores de pago y empresas de envío.</p>

            <h3 className="font-semibold text-lg text-foreground pt-4">4. Tus Derechos</h3>
            <p>Tienes derecho a acceder, corregir o eliminar tu información personal. Si tienes alguna pregunta sobre esta política de privacidad, por favor <a href="/contact" className="text-primary underline">contáctanos</a>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
