
'use server';

/**
 * @fileOverview A flow that generates a personalized promotional message for a new customer based on their gender.
 * - promoteByGender: The main function that orchestrates the promotion generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/types';

const PromoteByGenderInputSchema = z.object({
  customerId: z.string().describe('The ID of the new customer.'),
});
export type PromoteByGenderInput = z.infer<typeof PromoteByGenderInputSchema>;

const PromoteByGenderOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type PromoteByGenderOutput = z.infer<typeof PromoteByGenderOutputSchema>;


const ProductSuggestionSchema = z.object({
    name: z.string(),
    description: z.string(),
});

const PromotionPromptInputSchema = z.object({
  customerGender: z.string(),
  products: z.array(ProductSuggestionSchema),
});


export async function promoteByGender(input: PromoteByGenderInput): Promise<PromoteByGenderOutput> {
  return promoteByGenderFlow(input);
}

const promotionPrompt = ai.definePrompt({
    name: 'promotionPrompt',
    input: { schema: PromotionPromptInputSchema },
    prompt: `Eres un experto en marketing de moda. 
    Basado en el género del cliente ({{customerGender}}) y la siguiente lista de productos, crea un mensaje promocional corto y atractivo (2-3 frases) para un correo de bienvenida.
    Menciona al menos uno de los productos por su nombre.

    Productos:
    {{#each products}}
    - {{this.name}}: {{this.description}}
    {{/each}}
    `,
});


const promoteByGenderFlow = ai.defineFlow(
  {
    name: 'promoteByGenderFlow',
    inputSchema: PromoteByGenderInputSchema,
    outputSchema: PromoteByGenderOutputSchema,
  },
  async ({ customerId }) => {
    // 1. Fetch customer data to get their gender
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);

    if (!customerSnap.exists() || !customerSnap.data().gender) {
      console.log(`Customer ${customerId} not found or has no gender specified. Skipping promotion.`);
      return { success: false, message: 'Customer not found or no gender specified.' };
    }
    const customerGender = customerSnap.data().gender;

    // 2. Fetch recent products based on gender
    const productsRef = collection(db, 'products');
    const q = query(
        productsRef, 
        where('gender', '==', customerGender), 
        limit(3)
    );
    const productsSnap = await getDocs(q);
    const products = productsSnap.docs.map(doc => doc.data() as Product);
    
    if (products.length === 0) {
        console.log(`No products found for gender: ${customerGender}. Skipping promotion.`);
        return { success: false, message: `No products found for gender: ${customerGender}.` };
    }

    // 3. Generate the promotional message
    const { output: promotionalMessage } = await promotionPrompt({
        customerGender,
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
