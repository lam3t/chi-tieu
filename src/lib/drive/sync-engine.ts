"use client";

import { db } from "@/lib/db";
import { SyncStatusInfo, DriveMetaFile, DriveMonthFile } from "@/types/drive";
import { DEFAULT_SETTINGS } from "@/lib/constants";

type SyncListener = (status: SyncStatusInfo) => void;

class DriveSyncEngine {
  private status: SyncStatusInfo = {
    state: "synced",
    lastSyncedAt: null,
    message: "Sẵn sàng",
  };
  private listeners: Set<SyncListener> = new Set();
  private debounceTimer: NodeJS.Timeout | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private hasInitialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initEventListeners();
    }
  }

  private initEventListeners() {
    window.addEventListener("online", () => {
      this.updateStatus({ state: "syncing", message: "Đã có mạng, đang đồng bộ..." });
      this.performSync();
    });

    window.addEventListener("offline", () => {
      this.updateStatus({ state: "offline", message: "Ngoại tuyến (Offline)" });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.performSync();
      }
    });

    // Background sync every 60s
    this.intervalTimer = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        this.performSync();
      }
    }, 60_000);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  public getStatus(): SyncStatusInfo {
    return this.status;
  }

  private updateStatus(patch: Partial<SyncStatusInfo>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((listener) => listener(this.status));
  }

  /**
   * Schedules a debounced sync 3 seconds after local write
   */
  public scheduleDebouncedSync() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.performSync();
    }, 3000);
  }

  /**
   * Main sync workflow
   */
  public async performSync(options: { forcePull?: boolean } = {}) {
    if (typeof window === "undefined") return;
    if (this.isSyncing) return;

    if (!navigator.onLine) {
      this.updateStatus({ state: "offline", message: "Ngoại tuyến" });
      return;
    }

    this.isSyncing = true;
    this.updateStatus({ state: "syncing", message: "Đang đồng bộ..." });

    try {
      // 1. Initial login pull: check if first time syncing this session
      const isFirstRun = !this.hasInitialized || options.forcePull;

      if (isFirstRun) {
        const pullRes = await fetch("/api/drive/sync?pull=true");
        if (pullRes.status === 401) {
          this.updateStatus({
            state: "error",
            message: "Cần đăng nhập Google",
          });
          this.isSyncing = false;
          return;
        }

        if (pullRes.ok) {
          const data = await pullRes.json();
          const { remoteMeta, remoteMonths, files } = data;

          if (remoteMeta) {
            // Restore categories from Drive
            if (remoteMeta.categories && remoteMeta.categories.length > 0) {
              await db.categories.bulkPut(remoteMeta.categories);
            }
            // Restore settings
            if (remoteMeta.settings) {
              await db.settings.put({
                key: "app_settings",
                value: remoteMeta.settings,
              });
            }
          }

          if (remoteMonths && Array.isArray(remoteMonths)) {
            for (const rm of remoteMonths) {
              if (rm.transactions && rm.transactions.length > 0) {
                await db.transactions.bulkPut(rm.transactions);
              }
            }
          }

          // If no meta.json existed on Drive, enqueue meta sync to upload local seeds
          const hasMeta = files && files.some((f: { name: string }) => f.name === "meta.json");
          if (!hasMeta) {
            await db.enqueueSyncJob("meta");
          }

          this.hasInitialized = true;
        }
      }

      // 2. Process pending sync queue
      const pendingJobs = await db.syncQueue.toArray();

      if (pendingJobs.length > 0 || isFirstRun) {
        // Prepare local meta if pending
        let localMeta: DriveMetaFile | undefined;
        const needsMeta = pendingJobs.some((j) => j.type === "meta") || isFirstRun;
        if (needsMeta) {
          const cats = await db.categories.toArray();
          const settingsRec = await db.settings.get("app_settings");
          localMeta = {
            schemaVersion: 1,
            categories: cats,
            settings: settingsRec ? settingsRec.value : DEFAULT_SETTINGS,
            updatedAt: new Date().toISOString(),
          };
        }

        // Prepare local months
        const monthKeys = new Set<string>();
        pendingJobs
          .filter((j) => j.type === "month" && j.monthKey)
          .forEach((j) => monthKeys.add(j.monthKey!));

        const localMonths: DriveMonthFile[] = [];
        for (const mk of monthKeys) {
          const [y, m] = mk.split("-").map(Number);
          const start = new Date(y, m - 1, 1).toISOString();
          const end = new Date(y, m, 0, 23, 59, 59, 999).toISOString();

          // Get all transactions including deletedAt tombstones
          const txs = await db.transactions
            .where("date")
            .between(start, end, true, true)
            .toArray();

          localMonths.push({
            monthKey: mk,
            transactions: txs,
            updatedAt: new Date().toISOString(),
          });
        }

        if (localMeta || localMonths.length > 0) {
          const pushRes = await fetch("/api/drive/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ localMeta, localMonths }),
          });

          if (!pushRes.ok) {
            throw new Error(`Sync server responded with ${pushRes.status}`);
          }

          const pushData = await pushRes.json();

          // Save merged data back to Dexie
          if (pushData.mergedMeta?.categories) {
            await db.categories.bulkPut(pushData.mergedMeta.categories);
          }
          if (pushData.mergedMonths) {
            for (const mm of pushData.mergedMonths) {
              if (mm.transactions) {
                await db.transactions.bulkPut(mm.transactions);
              }
            }
          }

          // Clear processed sync queue jobs
          await db.syncQueue.clear();
        }
      }

      this.updateStatus({
        state: "synced",
        lastSyncedAt: new Date(),
        message: "Đã đồng bộ với Drive",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[DriveSyncEngine] Sync error:", message);
      this.updateStatus({
        state: "error",
        message: "Lỗi đồng bộ - Thử lại",
      });
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncEngine = new DriveSyncEngine();
