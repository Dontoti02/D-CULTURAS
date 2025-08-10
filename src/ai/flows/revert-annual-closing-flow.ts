
'use server';

/**
 * @fileOverview Flow for reverting an annual closing.
 * - revertAnnualClosing: Restores data from an annual closing archive.
 * - RevertAnnualClosingInput: The input type for the flow.
 * - RevertAnnualClosingOutput: The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  collection,
  doc,
  getDoc,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RevertAnnualClosingInputSchema = z.object({
  year: z.number().int().min(2020).max(new Date().getFullYear()),
});
export type RevertAnnualClosingInput = z.infer<typeof RevertAnnualClosingInputSchema>;

const RevertAnnualClosingOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  restoredCount: z.number(),
});
export type RevertAnnualClosingOutput = z.infer<typeof RevertAnnualClosingOutputSchema>;

export async function revertAnnualClosing(input: RevertAnnualClosingInput): Promise<RevertAnnualClosingOutput> {
  return revertAnnualClosingFlow(input);
}

const revertAnnualClosingFlow = ai.defineFlow(
  {
    name: 'revertAnnualClosingFlow',
    inputSchema: RevertAnnualClosingInputSchema,
    outputSchema: RevertAnnualClosingOutputSchema,
  },
  async ({ year }) => {
    try {
      const archiveDocRef = doc(db, 'annualClosings', year.toString());
      const archiveSnap = await getDoc(archiveDocRef);

      if (!archiveSnap.exists()) {
        throw new Error(`No se encontró un archivo de cierre para el año ${year}.`);
      }

      const archiveData = archiveSnap.data();
      const batch = writeBatch(db);
      let totalRestoredCount = 0;

      // Restore data for each collection found in the archive
      for (const collectionName in archiveData) {
        if (Array.isArray(archiveData[collectionName])) {
          const itemsToRestore = archiveData[collectionName];
          itemsToRestore.forEach((item: any) => {
            const { id, ...data } = item;
            if (id) {
              const docRef = doc(db, collectionName, id);
              batch.set(docRef, data);
              totalRestoredCount++;
            }
          });
        }
      }
      
      if (totalRestoredCount === 0) {
        throw new Error(`El archivo del año ${year} no contiene datos para restaurar.`);
      }

      // After restoring, delete the archive document
      batch.delete(archiveDocRef);

      await batch.commit();

      return {
        success: true,
        message: `Reversión para ${year} completada. Se restauraron ${totalRestoredCount} documentos.`,
        restoredCount: totalRestoredCount,
      };

    } catch (error: any) {
      console.error("Revert annual closing flow failed:", error);
      throw new Error(error.message || 'Ocurrió un error inesperado durante el proceso de reversión.');
    }
  }
);
