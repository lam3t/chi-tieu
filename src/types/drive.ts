import { Category, Settings, Transaction } from "./models";

export interface DriveMetaFile {
  schemaVersion: number;
  categories: Category[];
  settings: Settings;
  updatedAt: string; // ISO
}

export interface DriveMonthFile {
  monthKey: string; // YYYY-MM
  transactions: Transaction[];
  updatedAt: string; // ISO
}

export interface GoogleDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  md5Checksum?: string;
}

export type SyncState = "synced" | "syncing" | "offline" | "error";

export interface SyncStatusInfo {
  state: SyncState;
  lastSyncedAt: Date | null;
  message?: string;
}
