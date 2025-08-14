
'use server';

/**
 * @fileOverview Flow for sending emails.
 * - sendOrderConfirmationEmail: Sends an email to the customer after a successful order.
 * - sendWelcomeEmail: Sends a welcome email to a new registered customer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Order Confirmation Email Schemas & Flow
const OrderItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  image: z.string().optional(),
  size: z.string(),
});

const OrderConfirmationEmailInputSchema = z.object({
  to: z.string().email(),
  customerName: z.string(),
  orderId: z.string(),
  orderTotal: z.number(),
  orderItems: z.array(OrderItemSchema),
  orderDate: z.string(),
});
export type OrderConfirmationEmailInput = z.infer<typeof OrderConfirmationEmailInputSchema>;

export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput): Promise<{ success: boolean }> {
  return sendOrderConfirmationEmailFlow(input);
}

const sendOrderConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'sendOrderConfirmationEmailFlow',
    inputSchema: OrderConfirmationEmailInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    console.log('--- SIMULATING SENDING ORDER CONFIRMATION EMAIL ---');
    console.log(`To: ${input.to}`);
    console.log(`Subject: ¡Confirmación de tu pedido #${input.orderId.substring(0, 7)} en StylesUP!`);
    
    const emailBody = `
Hola ${input.customerName},

¡Gracias por tu compra en StylesUP!

Hemos recibido tu pedido y ya lo estamos preparando. Aquí tienes un resumen de tu compra:

Número de Pedido: #${input.orderId.substring(0, 7)}
Fecha del Pedido: ${input.orderDate}

Artículos:
${input.orderItems.map(item => `- ${item.name} (Talla: ${item.size}) - Cant: ${item.quantity} - S/ ${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Total: S/ ${input.orderTotal.toFixed(2)}

Te notificaremos de nuevo cuando tu pedido haya sido enviado.

¡Gracias por elegir StylesUP!

Saludos,
El equipo de StylesUP!
    `;
    
    console.log('Body:');
    console.log(emailBody);
    console.log('--- END OF SIMULATION ---');

    return { success: true };
  }
);


// Welcome Email Schemas & Flow
const WelcomeEmailInputSchema = z.object({
    to: z.string().email(),
    customerName: z.string(),
});
export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;

export async function sendWelcomeEmail(input: WelcomeEmailInput): Promise<{ success: boolean }> {
    return sendWelcomeEmailFlow(input);
}

const sendWelcomeEmailFlow = ai.defineFlow(
    {
        name: 'sendWelcomeEmailFlow',
        inputSchema: WelcomeEmailInputSchema,
        outputSchema: z.object({ success: z.boolean() }),
    },
    async (input) => {
        console.log('--- SIMULATING SENDING WELCOME EMAIL ---');
        console.log(`To: ${input.to}`);
        console.log(`Subject: ¡Bienvenido/a a StylesUP, ${input.customerName}!`);

        const emailBody = `
Hola ${input.customerName},

¡Te damos la más cordial bienvenida a StylesUP!

Estamos muy contentos de que te unas a nuestra comunidad de amantes de la moda. Tu cuenta ha sido creada exitosamente.

A partir de ahora, podrás:
- Explorar nuestras últimas colecciones.
- Guardar tus artículos favoritos.
- Disfrutar de un proceso de compra rápido y seguro.

¿Listo/a para empezar? Visita nuestra tienda y descubre tu próximo look favorito.

¡Felices compras!

Saludos,
El equipo de StylesUP!
        `;

        console.log('Body:');
        console.log(emailBody);
        console.log('--- END OF SIMULATION ---');

        return { success: true };
    }
);
