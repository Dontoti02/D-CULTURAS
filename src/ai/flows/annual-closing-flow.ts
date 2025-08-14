
'use server';

/**
 * @fileOverview Flow for handling the annual closing process.
 * - performAnnualClosing: Archives and then deletes data for a specific year.
 * - AnnualClosingInput: The input type for the flow.
 * - AnnualClosingOutput: The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  writeBatch,
  doc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AnnualClosingInputSchema = z.object({
  year: z.number().int().min(2020).max(new Date().getFullYear()),
});
export type AnnualClosingInput = z.infer<typeof AnnualClosingInputSchema>;

const AnnualClosingOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  archivedCount: z.number(),
});
export type AnnualClosingOutput = z.infer<typeof AnnualClosingOutputSchema>;

export async function performAnnualClosing(input: AnnualClosingInput): Promise<AnnualClosingOutput> {
  return annualClosingFlow(input);
}

const annualClosingFlow = ai.defineFlow(
  {
    name: 'annualClosingFlow',
    inputSchema: AnnualClosingInputSchema,
    outputSchema: AnnualClosingOutputSchema,
  },
  async ({ year }) => {
    try {
      const startDate = new Date(year, 0, 1); // January 1st of the year
      const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st of the year

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      // Collections to process
      const collectionsToProcess = ['orders', 'customers', 'promotions', 'admins'];
      const archiveData: { [key: string]: any[] } = {};
      const docsToDelete: { collection: string, id: string }[] = [];
      let totalArchivedCount = 0;

      // 1. Fetch data from all collections for the given year
      for (const collectionName of collectionsToProcess) {
        const collRef = collection(db, collectionName);
        const q = query(
          collRef,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp)
        );
        const snapshot = await getDocs(q);
        
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        archiveData[collectionName] = data;
        
        snapshot.docs.forEach(doc => {
            docsToDelete.push({ collection: collectionName, id: doc.id });
        });

        totalArchivedCount += data.length;
      }
      
      if (totalArchivedCount === 0) {
        throw new Error(`No se encontraron datos para archivar en el año ${year}.`);
      }

      // 2. Archive the data in a new document
      const archiveDocRef = doc(db, 'annualClosings', year.toString());
      await setDoc(archiveDocRef, {
        ...archiveData,
        createdAt: Timestamp.now(),
        year,
      });

      // 3. Delete the original data using a batch write
      const batch = writeBatch(db);
      docsToDelete.forEach(docInfo => {
        const docRef = doc(db, docInfo.collection, docInfo.id);
        batch.delete(docRef);
      });
      await batch.commit();

      return {
        success: true,
        message: `Cierre anual para ${year} completado. Se archivaron y eliminaron ${totalArchivedCount} documentos.`,
        archivedCount: totalArchivedCount,
      };

    } catch (error: any) {
      console.error("Annual closing flow failed:", error);
      // Re-throw the error to be caught by the client-side caller
      throw new Error(error.message || 'Ocurrió un error inesperado durante el proceso de cierre.');
    }
  }
);
