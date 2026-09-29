import { TransactionList } from "@/components/transaction/transaction-list";

export default function TransactionsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Sổ Giao Dịch
          </h2>
          <p className="text-xs text-slate-500">
            Xem, tìm kiếm, lọc và chỉnh sửa các khoản thu chi
          </p>
        </div>
      </div>

      <TransactionList showFilters={true} />
    </div>
  );
}
