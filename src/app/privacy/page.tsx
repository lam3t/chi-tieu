import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, HardDrive, Lock } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Chính Sách Quyền Riêng Tư (Privacy Policy)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Ứng dụng <strong>Sổ Chi Tiêu Cá Nhân</strong> cam kết tôn trọng và bảo vệ tối đa quyền riêng tư của người dùng.
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              1. Dữ liệu lưu trữ cá nhân (Google Drive AppData)
            </h4>
            <p>
              Toàn bộ dữ liệu tài chính (danh sách giao dịch, hạng mục, ngân sách) được lưu trữ trực tiếp trên thiết bị (IndexedDB) và đồng bộ độc quyền vào thư mục riêng tư <code>appDataFolder</code> trên Google Drive của chính bạn. Chúng tôi không lưu trữ bất kỳ dữ liệu chi tiêu nào trên máy chủ của bên thứ ba.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              2. Quyền truy cập Google
            </h4>
            <p>
              Ứng dụng chỉ yêu cầu phạm vi quyền hạn tối thiểu:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Thông tin định danh cơ bản (Email, Tên đại diện) để hiển thị thông tin tài khoản.</li>
              <li>Quyền <code>https://www.googleapis.com/auth/drive.appdata</code> chỉ cho phép ứng dụng đọc và ghi các file cấu hình do chính ứng dụng tạo ra trong thư mục ẩn của bạn. Ứng dụng hoàn toàn KHÔNG có quyền truy cập vào các tệp tin khác trên Google Drive của bạn.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">
              3. Tính năng quét hóa đơn bằng AI (OCR)
            </h4>
            <p>
              Ảnh hóa đơn chỉ được chuyển đến API mô hình thị giác để trích xuất số tiền và nơi mua, sau đó xóa ngay khỏi bộ nhớ đệm máy chủ và không được lưu giữ lại.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link href="/" className="text-emerald-600 font-semibold hover:underline">
              &larr; Quay lại trang chủ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
