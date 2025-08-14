
'use server';

/**
 * @fileOverview Flow for sending emails.
 * - sendOrderConfirmationEmail: Sends an email to the customer after a successful order.
 * - OrderConfirmationEmailInput: The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { OrderItem } from '@/lib/types';

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
    console.log('--- SIMULATING SENDING EMAIL ---');
    console.log(`To: ${input.to}`);
    console.log(`Subject: ¡Confirmación de tu pedido #${input.orderId.substring(0, 7)} en StylesUP!`);
    
    // Constructing a simple text-based email body
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

    // In a real application, you would integrate with an email service like SendGrid, Mailgun, or Resend here.
    // For example (using a hypothetical email service):
    // await emailService.send({
    //   to: input.to,
    //   subject: `¡Confirmación de tu pedido #${input.orderId.substring(0, 7)} en StylesUP!`,
    //   html: <OrderConfirmationTemplate {...input} /> // Using a React Email template
    // });

    return { success: true };
  }
);
