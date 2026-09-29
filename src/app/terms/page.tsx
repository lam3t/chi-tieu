import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Điều Khoản Sử Dụng (Terms of Service)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Chào mừng bạn đến với ứng dụng <strong>Sổ Chi Tiêu Cá Nhân</strong>. Bằng việc sử dụng ứng dụng, bạn đồng ý với các điều khoản dưới đây:
          </p>

          <div className="space-y-1">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">
              1. Mục đích sử dụng
            </h4>
            <p>
              Ứng dụng được thiết kế nhằm mục đích hỗ trợ cá nhân ghi chép thu chi, quản lý ngân sách và theo dõi dòng tiền cá nhân.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">
              2. Quyền sở hữu và trách nhiệm dữ liệu
            </h4>
            <p>
              Bạn là chủ sở hữu duy nhất đối với toàn bộ dữ liệu tài chính của mình được lưu trữ trên Google Drive cá nhân. Bạn có trách nhiệm bảo vệ thông tin đăng nhập Google của mình.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">
              3. Miễn trừ trách nhiệm
            </h4>
            <p>
              Ứng dụng cung cấp các công cụ tính toán và nhận định tài chính mang tính chất tham khảo dựa trên quy tắc 50/30/20, không cấu thành lời khuyên đầu tư tài chính chuyên nghiệp.
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
