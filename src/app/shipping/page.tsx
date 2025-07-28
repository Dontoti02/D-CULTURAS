
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Truck, Undo2 } from "lucide-react";


export default function ShippingReturnsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">Envíos y Devoluciones</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Información clara sobre cómo recibir y devolver tus productos.
        </p>
      </div>

      <div className="space-y-12">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                    <Truck className="w-8 h-8 text-primary"/>
                    Política de Envíos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">Tiempos de Entrega</h3>
                    <p>Los pedidos son procesados dentro de 1-2 días hábiles. Los tiempos de entrega estimados son:</p>
                    <ul className="list-disc list-inside pl-4">
                        <li><strong>Lima Metropolitana:</strong> 1-3 días hábiles.</li>
                        <li><strong>Provincias Principales:</strong> 3-5 días hábiles.</li>
                        <li><strong>Zonas Remotas:</strong> 5-10 días hábiles.</li>
                    </ul>
                </div>
                 <Separator />
                 <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">Costos de Envío</h3>
                    <p>¡Buenas noticias! Ofrecemos <span className="font-semibold text-primary">envío gratuito</span> en todos los pedidos a nivel nacional, sin mínimo de compra.</p>
                 </div>
                 <Separator />
                 <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">Seguimiento de Pedido</h3>
                    <p>Una vez que tu pedido sea enviado, recibirás un correo electrónico con un número de seguimiento para que puedas rastrear tu paquete en tiempo real.</p>
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                    <Undo2 className="w-8 h-8 text-primary"/>
                    Política de Devoluciones
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">Plazo de Devolución</h3>
                    <p>Tienes hasta <span className="font-semibold">30 días calendario</span> desde la fecha en que recibiste tu pedido para solicitar una devolución. Los artículos deben estar en su estado original: sin usar, sin lavar y con todas las etiquetas originales adjuntas.</p>
                </div>
                 <Separator />
                 <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">Proceso de Devolución</h3>
                     <ol className="list-decimal list-inside pl-4 space-y-1">
                        <li>Ponte en contacto con nuestro equipo de soporte a través de nuestra <a href="/contact" className="text-primary underline">página de contacto</a> para iniciar el proceso.</li>
                        <li>Te proporcionaremos las instrucciones y una etiqueta de envío de devolución.</li>
                        <li>Una vez que recibamos e inspeccionemos el artículo devuelto, procesaremos tu reembolso o cambio.</li>
                    </ol>
                 </div>
                 <Separator />
                 <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">Reembolsos</h3>
                    <p>Los reembolsos se procesan al método de pago original dentro de 5-7 días hábiles después de que hayamos recibido y aprobado la devolución. Ten en cuenta que los gastos de envío originales no son reembolsables.</p>
                 </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
