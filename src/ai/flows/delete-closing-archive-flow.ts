
'use server';

/**
 * @fileOverview Flow for deleting an annual closing archive document.
 * - deleteClosingArchive: Deletes a specific annual closing archive.
 * - DeleteClosingArchiveInput: The input type for the flow.
 * - DeleteClosingArchiveOutput: The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DeleteClosingArchiveInputSchema = z.object({
  year: z.number().int().min(2020).max(new Date().getFullYear()),
});
export type DeleteClosingArchiveInput = z.infer<typeof DeleteClosingArchiveInputSchema>;

const DeleteClosingArchiveOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteClosingArchiveOutput = z.infer<typeof DeleteClosingArchiveOutputSchema>;

export async function deleteClosingArchive(input: DeleteClosingArchiveInput): Promise<DeleteClosingArchiveOutput> {
  return deleteClosingArchiveFlow(input);
}

const deleteClosingArchiveFlow = ai.defineFlow(
  {
    name: 'deleteClosingArchiveFlow',
    inputSchema: DeleteClosingArchiveInputSchema,
    outputSchema: DeleteClosingArchiveOutputSchema,
  },
  async ({ year }) => {
    try {
      const archiveDocRef = doc(db, 'annualClosings', year.toString());
      
      // The user must confirm this action in the UI, so we proceed directly.
      await deleteDoc(archiveDocRef);

      return {
        success: true,
        message: `El archivo de cierre para el año ${year} ha sido eliminado permanentemente.`,
      };

    } catch (error: any) {
      console.error("Delete closing archive flow failed:", error);
      throw new Error(error.message || 'Ocurrió un error inesperado al eliminar el archivo de cierre.');
    }
  }
);
