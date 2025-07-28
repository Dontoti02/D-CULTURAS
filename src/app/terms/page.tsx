
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">Términos y Condiciones</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Por favor, lee nuestros términos de servicio antes de usar nuestra plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <ShieldCheck className="w-8 h-8 text-primary"/>
            Acuerdo de Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
            <p>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Bienvenido a stylesUP!. Estos términos y condiciones describen las reglas y regulaciones para el uso de nuestro sitio web y los servicios que ofrecemos. Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No continúes usando stylesUP! si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.</p>
            
            <h3 className="font-semibold text-lg text-foreground pt-4">1. Cuentas de Usuario</h3>
            <p>Cuando creas una cuenta con nosotros, debes proporcionarnos información precisa, completa y actualizada en todo momento. El incumplimiento de esta disposición constituye una violación de los Términos, lo que puede resultar en la terminación inmediata de tu cuenta en nuestro Servicio.</p>

            <h3 className="font-semibold text-lg text-foreground pt-4">2. Pedidos y Pagos</h3>
            <p>Nos reservamos el derecho de rechazar o cancelar tu pedido en cualquier momento por ciertas razones, incluyendo pero no limitado a: disponibilidad del producto, errores en la descripción o precio del producto, error en tu pedido u otras razones. Aceptas proporcionar información de pago y compra actual, completa y precisa para todas las compras realizadas en nuestra tienda.</p>

             <h3 className="font-semibold text-lg text-foreground pt-4">3. Propiedad Intelectual</h3>
            <p>El Servicio y su contenido original, características y funcionalidad son y seguirán siendo propiedad exclusiva de stylesUP! y sus licenciantes. El Servicio está protegido por derechos de autor, marcas registradas y otras leyes tanto de Perú como de países extranjeros.</p>

            <h3 className="font-semibold text-lg text-foreground pt-4">4. Cambios en los Términos</h3>
            <p>Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que los nuevos términos entren en vigencia.</p>
        </CardContent>
      </Card>
    </div>
  );
}
