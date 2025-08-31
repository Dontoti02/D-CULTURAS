
'use server';

/**
 * @fileOverview A flow that generates a personalized promotional message for a new customer.
 * - generateWelcomePromotion: The main function that orchestrates the promotion generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/types';

const WelcomePromotionInputSchema = z.object({
  customerId: z.string().describe('The ID of the new customer.'),
});
export type WelcomePromotionInput = z.infer<typeof WelcomePromotionInputSchema>;

const WelcomePromotionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type WelcomePromotionOutput = z.infer<typeof WelcomePromotionOutputSchema>;


const ProductSuggestionSchema = z.object({
    name: z.string(),
    description: z.string(),
});

const PromotionPromptInputSchema = z.object({
  customerName: z.string(),
  products: z.array(ProductSuggestionSchema),
});


export async function generateWelcomePromotion(input: WelcomePromotionInput): Promise<WelcomePromotionOutput> {
  return generateWelcomePromotionFlow(input);
}

const promotionPrompt = ai.definePrompt({
    name: 'promotionPrompt',
    input: { schema: PromotionPromptInputSchema },
    prompt: `Eres un experto en marketing de moda. 
    Basado en la siguiente lista de productos recién llegados, crea un mensaje promocional corto y atractivo (2-3 frases) para un correo de bienvenida para {{customerName}}.
    Menciona al menos uno de los productos por su nombre.

    Productos:
    {{#each products}}
    - {{this.name}}: {{this.description}}
    {{/each}}
    `,
});


const generateWelcomePromotionFlow = ai.defineFlow(
  {
    name: 'generateWelcomePromotionFlow',
    inputSchema: WelcomePromotionInputSchema,
    outputSchema: WelcomePromotionOutputSchema,
  },
  async ({ customerId }) => {
    // 1. Fetch customer data to get their name
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);

    if (!customerSnap.exists()) {
      console.log(`Customer ${customerId} not found. Skipping promotion.`);
      return { success: false, message: 'Customer not found.' };
    }
    const customerName = customerSnap.data().firstName;

    // 2. Fetch recent products (any category)
    const productsRef = collection(db, 'products');
    const q = query(
        productsRef, 
        orderBy('createdAt', 'desc'),
        limit(3)
    );
    const productsSnap = await getDocs(q);
    const products = productsSnap.docs.map(doc => doc.data() as Product);
    
    if (products.length === 0) {
        console.log(`No products found. Skipping promotion.`);
        return { success: false, message: `No products found.` };
    }

    // 3. Generate the promotional message
    const { output: promotionalMessage } = await promotionPrompt({
        customerName,
        products: products.map(p => ({ name: p.name, description: p.description })),
    });

    // 4. Log the result (in a real app, this would be sent via email, push notification, etc.)
    console.log('--- PERSONALIZED PROMOTION ---');
    console.log(`For Customer ID: ${customerId}`);
    console.log(`Generated Message: ${promotionalMessage}`);
    console.log('--- END OF PROMOTION ---');
    
    return {
      success: true,
      message: 'Promotional content generated successfully.',
    };
  }
);
