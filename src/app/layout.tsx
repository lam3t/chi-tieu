import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AppQueryProvider } from "@/components/providers/query-provider";
import { DbInitializer } from "@/components/providers/db-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaRegister } from "@/components/providers/pwa-register";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingActionButtons } from "@/components/layout/floating-action-buttons";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Sổ Chi Tiêu Cá Nhân | Quản lý Tài chính Tức thì",
  description:
    "Ứng dụng quản lý thu chi cá nhân siêu nhanh, đồng bộ trực tiếp lên Google Drive cá nhân, chuẩn PWA hoạt động ngoại tuyến.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chi Tiêu",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body
        className={`${inter.variable} font-sans antialiased h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200`}
      >
        <ThemeProvider>
          <AuthSessionProvider>
            <AppQueryProvider>
              <DbInitializer>
                <ToastProvider>
                  <PwaRegister />
                  <AppHeader />
                  <main className="flex-1 max-w-md w-full mx-auto pb-32 px-4 pt-3">
                    {children}
                  </main>
                  <FloatingActionButtons />
                  <BottomNav />
                </ToastProvider>
              </DbInitializer>
            </AppQueryProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
