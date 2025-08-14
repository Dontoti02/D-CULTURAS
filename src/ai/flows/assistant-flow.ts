
'use server';
/**
 * @fileOverview An AI assistant that can answer questions about the store's data.
 * - getAssistantResponse: The main function to get a response from the AI assistant.
 * - AssistantInput: The input type for the assistant.
 * - AssistantOutput: The return type for the assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Customer, Order, Promotion } from '@/lib/types';

// Schemas
const AssistantInputSchema = z.object({
  question: z.string().describe('The user\'s question about store data.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s question.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// Tool to fetch data from Firestore
const fetchFirestoreData = ai.defineTool(
  {
    name: 'fetchFirestoreData',
    description: 'Fetches data from a specified Firestore collection. Use this to answer questions about products, orders, customers, finances, promotions, and inventory.',
    inputSchema: z.object({
      collectionName: z.enum(['products', 'orders', 'customers', 'promotions']).describe('The name of the collection to fetch data from.'),
    }),
    outputSchema: z.array(z.any()).describe('An array of documents from the specified collection.'),
  },
  async ({ collectionName }) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Return a simplified version for the prompt to avoid token limits
      // For a real-world scenario, you might want more complex logic to summarize or paginate
      return data.slice(0, 20).map(item => {
        const simplified: any = { id: item.id };
        switch(collectionName) {
            case 'products':
                simplified.name = item.name;
                simplified.price = item.price;
                simplified.stock = item.stock;
                simplified.category = item.category;
                simplified.gender = item.gender;
                break;
            case 'orders':
                simplified.total = item.total;
                simplified.status = item.status;
                simplified.itemCount = item.items.length;
                simplified.customerName = item.customerName;
                break;
            case 'customers':
                simplified.firstName = item.firstName;
                simplified.lastName = item.lastName;
                simplified.email = item.email;
                simplified.status = item.status;
                break;
            case 'promotions':
                 simplified.name = item.name;
                 simplified.code = item.code;
                 simplified.status = item.status;
                 simplified.value = item.value;
                 simplified.type = item.type;
                break;
        }
        return simplified;
      });
    } catch (error) {
      console.error(`Error fetching from ${collectionName}:`, error);
      return [{ error: `Failed to fetch data from ${collectionName}.` }];
    }
  }
);


// Prompt definition
const assistantPrompt = ai.definePrompt({
  name: 'storeAssistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { schema: AssistantOutputSchema },
  system: `Eres un asistente de IA experto en análisis de datos para una tienda de comercio electrónico llamada StylesUP!. Tu objetivo es responder a las preguntas del administrador de la tienda de manera concisa y precisa. Utiliza la herramienta 'fetchFirestoreData' para obtener los datos necesarios y responder a la pregunta.

Instrucciones:
1. Analiza la pregunta del usuario para determinar qué datos necesitas.
2. Llama a la herramienta 'fetchFirestoreData' con el nombre de la colección apropiada ('products', 'orders', 'customers', 'promotions').
3. Utiliza los datos devueltos por la herramienta para formular una respuesta clara y directa.
4. Si la pregunta es sobre inventario, utiliza la colección 'products'.
5. Si la pregunta es sobre finanzas o ventas, utiliza la colección 'orders'.
6. No inventes datos. Si la información no está disponible a través de las herramientas, indícalo.
7. Sé breve y ve al grano. Proporciona solo la respuesta, sin saludos ni introducciones innecesarias.`,
  tools: [fetchFirestoreData],
  prompt: `{{{question}}}`,
});

// Flow definition
const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async ({ question }) => {
    try {
      const { output } = await assistantPrompt({ question });
      if (!output) {
        throw new Error('La IA no pudo generar una respuesta.');
      }
      return output;
    } catch (error: any) {
      console.error("Assistant flow failed:", error);
      throw new Error(error.message || 'Ocurrió un error inesperado en el asistente de IA.');
    }
  }
);

export async function getAssistantResponse(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}
