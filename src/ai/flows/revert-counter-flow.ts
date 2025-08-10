
'use server';

/**
 * @fileOverview Flow for managing the annual closing revert counter.
 * - getRevertCount: Retrieves the current number of reverts available.
 * - decrementRevertCount: Decreases the revert count by one.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  doc,
  getDoc,
  setDoc,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const REVERT_LIMIT = 2;

// Get Revert Count Flow
export async function getRevertCount(): Promise<number> {
  return getRevertCountFlow();
}

const getRevertCountFlow = ai.defineFlow(
  {
    name: 'getRevertCountFlow',
    outputSchema: z.number(),
  },
  async () => {
    try {
      const counterRef = doc(db, 'appState', 'revertCounter');
      const counterSnap = await getDoc(counterRef);

      if (!counterSnap.exists()) {
        // If the counter doesn't exist, initialize it.
        await setDoc(counterRef, { count: REVERT_LIMIT });
        return REVERT_LIMIT;
      }

      return counterSnap.data().count;
    } catch (error: any) {
      console.error("Get revert count flow failed:", error);
      throw new Error(error.message || 'No se pudo obtener el contador de reversiones.');
    }
  }
);

// Decrement Revert Count Flow
export async function decrementRevertCount(): Promise<{success: boolean}> {
  return decrementRevertCountFlow();
}

const decrementRevertCountFlow = ai.defineFlow(
  {
    name: 'decrementRevertCountFlow',
    outputSchema: z.object({ success: z.boolean() }),
  },
  async () => {
    const counterRef = doc(db, 'appState', 'revertCounter');
    
    try {
      await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists()) {
          throw new Error("El contador de reversiones no está inicializado.");
        }
        
        const currentCount = counterDoc.data().count;
        if (currentCount <= 0) {
          throw new Error("No quedan intentos de reversión.");
        }
        
        transaction.update(counterRef, { count: increment(-1) });
      });

      return { success: true };
    } catch (error: any) {
      console.error("Decrement revert count flow failed:", error);
      throw new Error(error.message || 'No se pudo decrementar el contador de reversiones.');
    }
  }
);
