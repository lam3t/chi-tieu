"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { ShieldCheck, HardDrive, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Login failed:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="max-w-md mx-auto w-full pt-10">
        {/* Logo & Hero */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/20">
            <span className="text-3xl font-extrabold tracking-tight">₫</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sổ Chi Tiêu Cá Nhân
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Nhanh chóng &bull; Riêng tư &bull; Đồng bộ Google Drive
            </p>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Dữ liệu thuộc về bạn 100%
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Toàn bộ dữ liệu lưu trong Google Drive cá nhân của bạn (thư mục riêng tư appDataFolder). Không có database trung gian.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Ghi chép dưới 5 giây
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Bàn phím số nhanh, tự gợi ý hạng mục thường dùng, hỗ trợ quét hóa đơn / ảnh chụp chuyển khoản bằng AI.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Hoạt động Offline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Ghi chép tức thì ngay cả khi không có mạng (IndexedDB), tự động đồng bộ khi có kết nối trở lại.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            size="lg"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 shadow-sm h-12"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-medium text-sm">
              {isLoading ? "Đang kết nối..." : "Đăng nhập với Google"}
            </span>
          </Button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 leading-normal px-4">
            Bằng cách tiếp tục, bạn cho phép ứng dụng lưu trữ và đồng bộ dữ liệu chi tiêu trên Google Drive của chính bạn.
          </p>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 dark:text-slate-600">
        Phiên bản 1.0 &bull; Chuẩn PWA &bull; Mã hóa & Riêng tư
      </div>
    </div>
  );
}
