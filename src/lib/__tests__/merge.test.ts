import { describe, it, expect } from "vitest";
import { mergeTransactions, mergeCategories } from "../drive/merge";
import { Transaction, Category } from "@/types/models";

describe("Transaction Conflict Resolution (Last-Write-Wins)", () => {
  const baseTx: Transaction = {
    id: "tx-1",
    type: "expense",
    amount: 50000,
    categoryId: "cat_an_uong",
    note: "Phở",
    date: "2026-09-29T08:00:00.000Z",
    createdAt: "2026-09-29T08:00:00.000Z",
    updatedAt: "2026-09-29T08:00:00.000Z",
    source: "manual",
  };

  it("adds non-conflicting remote records", () => {
    const local = [baseTx];
    const remote: Transaction[] = [
      {
        ...baseTx,
        id: "tx-2",
        note: "Cafe",
        updatedAt: "2026-09-29T08:15:00.000Z",
      },
    ];

    const merged = mergeTransactions(local, remote);
    expect(merged.length).toBe(2);
    expect(merged.map((m) => m.id)).toEqual(["tx-1", "tx-2"]);
  });

  it("updates local record when remote updatedAt is newer", () => {
    const local = [baseTx]; // updatedAt: 08:00
    const remote: Transaction[] = [
      {
        ...baseTx,
        amount: 60000,
        note: "Phở đặc biệt",
        updatedAt: "2026-09-29T08:30:00.000Z", // Newer
      },
    ];

    const merged = mergeTransactions(local, remote);
    expect(merged.length).toBe(1);
    expect(merged[0].amount).toBe(60000);
    expect(merged[0].note).toBe("Phở đặc biệt");
  });

  it("keeps local record when local updatedAt is newer", () => {
    const local: Transaction[] = [
      {
        ...baseTx,
        amount: 70000,
        note: "Phở tái gầu",
        updatedAt: "2026-09-29T09:00:00.000Z", // Newer
      },
    ];
    const remote: Transaction[] = [
      {
        ...baseTx,
        amount: 50000,
        updatedAt: "2026-09-29T08:00:00.000Z", // Older
      },
    ];

    const merged = mergeTransactions(local, remote);
    expect(merged.length).toBe(1);
    expect(merged[0].amount).toBe(70000);
    expect(merged[0].note).toBe("Phở tái gầu");
  });

  it("preserves tombstone deletedAt when remote deleted the item", () => {
    const local: Transaction[] = [
      {
        ...baseTx,
        updatedAt: "2026-09-29T08:00:00.000Z",
        deletedAt: null,
      },
    ];
    const remote: Transaction[] = [
      {
        ...baseTx,
        updatedAt: "2026-09-29T08:30:00.000Z",
        deletedAt: "2026-09-29T08:30:00.000Z", // Remote tombstone
      },
    ];

    const merged = mergeTransactions(local, remote);
    expect(merged.length).toBe(1);
    expect(merged[0].deletedAt).toBe("2026-09-29T08:30:00.000Z");
  });
});
