import Dexie, { type Table } from "dexie";
import { nanoid } from "nanoid";
import { Transaction, Category, Settings, SyncJob } from "@/types/models";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "./constants";

export interface SettingsRecord {
  key: string;
  value: Settings;
}

export class PersonalFinanceDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  settings!: Table<SettingsRecord, string>;
  syncQueue!: Table<SyncJob, number>;

  constructor() {
    super("ChiTieuDB");
    this.version(1).stores({
      transactions: "id, categoryId, date, type, createdAt, updatedAt, deletedAt",
      categories: "id, name, type, group",
      settings: "key",
      syncQueue: "++id, type, monthKey, status, createdAt",
    });
  }

  async ensureOpen() {
    if (!this.isOpen()) {
      try {
        await this.open();
      } catch (err) {
        console.warn("Retrying open ChiTieuDB:", err);
      }
    }
  }

  async initSeed() {
    try {
      await this.ensureOpen();
      // Seed categories if empty
      const catCount = await this.categories.count();
      if (catCount === 0) {
        await this.categories.bulkAdd(DEFAULT_CATEGORIES);
      }

      // Seed settings if empty
      const settingsRec = await this.settings.get("app_settings");
      if (!settingsRec) {
        await this.settings.put({
          key: "app_settings",
          value: {
            ...DEFAULT_SETTINGS,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err) {
      console.warn("Dexie initSeed error:", err);
    }
  }

  async enqueueSyncJob(type: "meta" | "month", monthKey?: string) {
    try {
      await this.syncQueue.add({
        type,
        monthKey,
        status: "pending",
        retryCount: 0,
        createdAt: Date.now(),
      });

      // Notify sync engine if in browser environment
      if (typeof window !== "undefined") {
        import("./drive/sync-engine").then(({ syncEngine }) => {
          syncEngine.scheduleDebouncedSync();
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Failed to enqueue sync job", e);
    }
  }

  async addTransaction(
    data: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<Transaction> {
    const now = new Date().toISOString();
    const id = nanoid();
    const transaction: Transaction = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await this.transactions.add(transaction);

    // Enqueue sync job for the month (YYYY-MM)
    const monthKey = data.date.slice(0, 7);
    await this.enqueueSyncJob("month", monthKey);

    return transaction;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, "id" | "createdAt">>
  ): Promise<void> {
    const existing = await this.transactions.get(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated = {
      ...updates,
      updatedAt: now,
    };

    await this.transactions.update(id, updated);

    const monthKey = (updates.date || existing.date).slice(0, 7);
    await this.enqueueSyncJob("month", monthKey);
  }

  async softDeleteTransaction(id: string): Promise<Transaction | undefined> {
    const existing = await this.transactions.get(id);
    if (!existing) return;

    const now = new Date().toISOString();
    await this.transactions.update(id, {
      deletedAt: now,
      updatedAt: now,
    });

    const monthKey = existing.date.slice(0, 7);
    await this.enqueueSyncJob("month", monthKey);
    return existing;
  }

  async restoreTransaction(id: string): Promise<void> {
    const existing = await this.transactions.get(id);
    if (!existing) return;

    const now = new Date().toISOString();
    await this.transactions.update(id, {
      deletedAt: null,
      updatedAt: now,
    });

    const monthKey = existing.date.slice(0, 7);
    await this.enqueueSyncJob("month", monthKey);
  }

  async getRecentCategoryUsage(limit: number = 8): Promise<string[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const isoString = ninetyDaysAgo.toISOString();

    const txs = await this.transactions
      .where("date")
      .aboveOrEqual(isoString)
      .filter((t) => !t.deletedAt)
      .toArray();

    const counts: Record<string, number> = {};
    for (const tx of txs) {
      counts[tx.categoryId] = (counts[tx.categoryId] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }
}

export const db = new PersonalFinanceDB();
