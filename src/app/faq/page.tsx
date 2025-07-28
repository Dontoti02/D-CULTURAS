
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
    {
        question: "¿Cuáles son los métodos de pago aceptados?",
        answer: "Aceptamos todas las principales tarjetas de crédito y débito (Visa, MasterCard, American Express), así como pagos a través de PagoEfectivo. Toda la información de pago se procesa de forma segura."
    },
    {
        question: "¿Cuánto tiempo tarda en llegar mi pedido?",
        answer: "Los tiempos de envío varían según tu ubicación. Para Lima Metropolitana, la entrega suele tardar de 1 a 3 días hábiles. Para otras provincias, el tiempo estimado es de 3 a 7 días hábiles. Recibirás un correo de confirmación con el seguimiento de tu pedido."
    },
    {
        question: "¿Cuál es su política de devoluciones?",
        answer: "Ofrecemos una política de devolución de 30 días. Si no estás satisfecho con tu compra, puedes devolver los artículos siempre que estén en su estado original, sin usar y con las etiquetas puestas. Visita nuestra página de 'Envíos y Devoluciones' para más detalles."
    },
    {
        question: "¿Cómo puedo hacer el seguimiento de mi pedido?",
        answer: "Una vez que tu pedido haya sido enviado, recibirás un correo electrónico de confirmación de envío que incluirá un número de seguimiento y un enlace a la página del transportista. También puedes encontrar esta información en la sección 'Mis Pedidos' de tu perfil."
    },
    {
        question: "¿Ofrecen envíos internacionales?",
        answer: "Actualmente, solo realizamos envíos dentro de Perú. Estamos trabajando para expandir nuestras opciones de envío en el futuro. ¡Mantente atento a las actualizaciones!"
    }
]

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">Preguntas Frecuentes</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Encuentra respuestas a las consultas más comunes.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
             <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg hover:no-underline">
                    {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                    {item.answer}
                </AccordionContent>
            </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
