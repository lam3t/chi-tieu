import { Transaction, Category, Settings } from "@/types/models";

/**
 * Downloads a string as a file on client-side
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports transactions to CSV with UTF-8 BOM for Excel compatibility
 */
export function exportTransactionsCSV(
  transactions: Transaction[],
  categories: Category[]
) {
  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.name));

  const headers = [
    "Mã GD",
    "Ngày",
    "Loại",
    "Số tiền (VND)",
    "Hạng mục",
    "Ghi chú",
    "Nơi bán/Người nhận",
    "Nguồn",
  ];

  const rows = transactions
    .filter((t) => !t.deletedAt)
    .map((t) => {
      const dateFormatted = t.date.slice(0, 10);
      const typeStr = t.type === "expense" ? "Chi tiêu" : "Thu nhập";
      const catName = catMap.get(t.categoryId) || "Khác";
      const noteStr = `"${(t.note || "").replace(/"/g, '""')}"`;
      const merchantStr = `"${(t.merchant || "").replace(/"/g, '""')}"`;
      const sourceStr = t.source === "ocr" ? "AI OCR" : "Thủ công";

      return [
        t.id,
        dateFormatted,
        typeStr,
        t.amount,
        `"${catName}"`,
        noteStr,
        merchantStr,
        sourceStr,
      ].join(",");
    });

  // \uFEFF is UTF-8 Byte Order Mark for Excel
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const today = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `chi-tieu-${today}.csv`, "text/csv");
}

/**
 * Exports full backup JSON
 */
export function exportAllJSON(
  transactions: Transaction[],
  categories: Category[],
  settings?: Settings
) {
  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    settings: settings || null,
    categories,
    transactions: transactions.filter((t) => !t.deletedAt),
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const today = new Date().toISOString().slice(0, 10);
  downloadFile(jsonStr, `sổ-chi-tiêu-backup-${today}.json`, "application/json");
}
