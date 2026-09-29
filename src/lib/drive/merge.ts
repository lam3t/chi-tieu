import { Transaction, Category } from "@/types/models";

/**
 * Merges local and remote transactions using Last-Write-Wins (LWW) by `updatedAt`.
 * Preserves tombstones (`deletedAt`).
 */
export function mergeTransactions(
  localList: Transaction[],
  remoteList: Transaction[]
): Transaction[] {
  const map = new Map<string, Transaction>();

  // Add all local transactions first
  for (const localTx of localList) {
    map.set(localTx.id, localTx);
  }

  // Merge remote transactions
  for (const remoteTx of remoteList) {
    const existing = map.get(remoteTx.id);
    if (!existing) {
      map.set(remoteTx.id, remoteTx);
      continue;
    }

    const localTime = new Date(existing.updatedAt).getTime();
    const remoteTime = new Date(remoteTx.updatedAt).getTime();

    if (remoteTime > localTime) {
      map.set(remoteTx.id, remoteTx);
    } else if (remoteTime === localTime) {
      // If timestamps match, tombstone takes precedence to prevent re-resurrecting deleted items
      if (remoteTx.deletedAt && !existing.deletedAt) {
        map.set(remoteTx.id, remoteTx);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Merges categories: ensures all categories exist, keeping newer local edits
 */
export function mergeCategories(
  localList: Category[],
  remoteList: Category[]
): Category[] {
  const map = new Map<string, Category>();

  for (const cat of remoteList) {
    map.set(cat.id, cat);
  }

  for (const cat of localList) {
    // Local modifications or custom categories override remote defaults
    map.set(cat.id, cat);
  }

  return Array.from(map.values());
}
