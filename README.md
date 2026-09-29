# Sổ Chi Tiêu Cá Nhân (Personal Expense Tracker)

Ứng dụng web quản lý thu chi cá nhân chuẩn PWA (Mobile-first), hoạt động ngoại tuyến (Offline-first) với IndexedDB (Dexie) và tự động đồng bộ 100% dữ liệu lên thư mục riêng tư Google Drive (`appDataFolder`) của chính người dùng. Không có cơ sở dữ liệu trung gian, bảo vệ quyền riêng tư tuyệt đối. Hỗ trợ quét hóa đơn / ảnh chụp chuyển khoản ngân hàng bằng AI Claude Vision.

---

## 🌟 Tính Năng Nổi Bật

1. **Mobile-first PWA & Offline Shell**:
   - Trải nghiệm ứng dụng gốc, cài đặt trực tiếp lên màn hình chính điện thoại (iOS / Android).
   - Hoạt động ngoại tuyến 100% thông qua Dexie (IndexedDB) và Service Worker.
2. **Ghi chép siêu tốc (<= 3 chạm, <= 5 giây)**:
   - Nút (+) nổi trong tầm ngón cái (Thumb Zone).
   - Bàn phím số lớn có phím `000` nhập tiền triệu/trăm nghìn tức thì, định dạng tiền tệ VND thời gian thực (`1.250.000 ₫`).
   - Dải chip danh mục tự động ưu tiên các hạng mục sử dụng nhiều nhất từ lịch sử.
   - Hỗ trợ thông báo nổi hoàn tác (Undo) ngay lập tức.
3. **Đồng bộ Google Drive AppData riêng tư**:
   - Dữ liệu lưu trong `appDataFolder` (`meta.json` cho danh mục/cài đặt và `tx-YYYY-MM.json` cho từng tháng).
   - Tự động đồng bộ ngầm: khi mở ứng dụng, 3s sau khi nhập (debounced), khi có mạng trở lại, và chu kỳ mỗi 60s.
   - Giải quyết xung đột theo nguyên tắc Last-Write-Wins (LWW) và lưu vết xóa (tombstone `deletedAt`).
4. **Quét hóa đơn AI (Receipt OCR)**:
   - Gọi Anthropic Claude Vision độc quyền từ server route an toàn (`/api/ocr`).
   - Nén ảnh client-side (tối đa 1600px, JPEG ~0.7) trước khi tải lên.
   - Nhận diện linh hoạt định dạng tiền Việt Nam và ảnh chụp màn hình chuyển khoản ngân hàng (Vietcombank, MoMo, Techcombank, ZaloPay, BIDV, VPBank, MBBank).
5. **Dashboard Phân tích Tài chính Cá nhân Chuẩn PFM**:
   - Quy tắc 50/30/20 (Thiết yếu / Linh hoạt / Tích lũy).
   - Định mức ngân sách từng hạng mục với cảnh báo màu ở mức 80% và 100%.
   - Biểu đồ Donut cơ cấu chi tiêu, Top 5 khoản chi lớn nhất, Top nơi chi tiêu.
   - Xu hướng thu & chi 6 tháng và tỷ lệ tiết kiệm.
   - Chi tiêu từng ngày và dự phóng tổng chi tiêu cuối tháng dựa trên tốc độ hiện tại.
   - Nhận định & khuyến nghị tài chính tự động (phát hiện chi phí đột biến, giao dịch định kỳ hàng tháng).
6. **Sao lưu & Quản lý**:
   - Xuất dữ liệu ra file Microsoft Excel / CSV (mã hóa UTF-8 BOM hiển thị chuẩn tiếng Việt) và JSON.
   - Chế độ Giao diện Sáng / Tối (Dark mode).

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend & Server**: Next.js 15 (App Router, Turbopack) + TypeScript (strict mode) + React 19
- **Styling**: Tailwind CSS + shadcn/ui design tokens + Lucide React
- **Xác thực**: Auth.js v5 (NextAuth) với Google Provider & Refresh Token
- **Cơ sở dữ liệu cục bộ**: Dexie (IndexedDB) + `dexie-react-hooks`
- **Biểu đồ**: Recharts (nạp động qua `next/dynamic` tối ưu bundle)
- **AI OCR**: Anthropic API (`@anthropic-ai/sdk`)
- **Kiểm thử**: Vitest

---

## 🔑 Hướng Dẫn Cấu Hình Google Cloud (OAuth 2.0)

Để kích hoạt tính năng đăng nhập Google và đồng bộ Google Drive AppData:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo mới một dự án (Project), ví dụ: `Personal Expense Tracker`.
3. Bật API cần thiết:
   - Vào mục **APIs & Services** -> **Library**.
   - Tìm kiếm **Google Drive API** -> Bấm **Enable**.
4. Cấu hình Màn hình chấp thuận OAuth (OAuth consent screen):
   - Chọn loại người dùng: **External**.
   - Điền App Name, User support email, Developer contact email.
   - Tại mục **Scopes (Phạm vi truy cập)**, bấm **Add or Remove Scopes** và thêm các phạm vi:
     - `openid`
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `https://www.googleapis.com/auth/drive.appdata` *(Quyền truy cập thư mục dữ liệu cấu hình ứng dụng riêng tư)*.
   - Tại mục **Test users**, thêm email Google của bạn (nếu ứng dụng đang ở trạng thái Testing).
5. Tạo OAuth Client ID:
   - Vào mục **Credentials** -> **Create Credentials** -> **OAuth client ID**.
   - Chọn **Application type**: `Web application`.
   - Tại mục **Authorized redirect URIs**, thêm cả 2 đường dẫn sau:
     - `http://localhost:3000/api/auth/callback/google` (Dành cho môi trường phát triển cục bộ)
     - `https://<ten-mien-cua-ban>.vercel.app/api/auth/callback/google` (Dành cho môi trường production trên Vercel)
6. Sao chép **Client ID** và **Client Secret** để sử dụng trong file biến môi trường.

---

## ⚙️ Biến Môi Trường (.env.local)

Tạo file `.env.local` tại thư mục gốc của dự án với nội dung như sau:

```env
# Auth.js / NextAuth
AUTH_SECRET="chuoi-bi-mat-ngau-nhien-it-nhat-32-ky-tu"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth Credentials
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Anthropic Claude Vision API (Dành cho tính năng quét hóa đơn OCR)
ANTHROPIC_API_KEY="sk-ant-api03-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
```

> **Tạo AUTH_SECRET:** Bạn có thể sinh một khóa ngẫu nhiên an toàn bằng lệnh:
> ```bash
> npx auth secret
> ```
> hoặc trên Linux/macOS: `openssl rand -base64 33`.

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

1. Cài đặt các thư viện:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Chạy máy chủ phát triển:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

3. Chạy bộ kiểm thử tự động (Vitest):
   ```bash
   npm test
   ```

4. Kiểm tra biên dịch bản Production:
   ```bash
   npm run build
   ```

---

## 🚀 Hướng Dẫn Triển Khai Lên Vercel

1. Đẩy mã nguồn lên kho chứa GitHub / GitLab của bạn.
2. Đăng nhập vào [Vercel Dashboard](https://vercel.com/) và chọn **Add New Project**.
3. Import kho chứa của bạn.
4. Tại mục **Environment Variables**, thêm đầy đủ các biến môi trường:
   - `AUTH_SECRET`: Khóa bí mật JWT.
   - `NEXTAUTH_URL`: Địa chỉ tên miền Vercel của bạn (ví dụ: `https://chi-tieu.vercel.app`).
   - `AUTH_GOOGLE_ID`: Google OAuth Client ID.
   - `AUTH_GOOGLE_SECRET`: Google OAuth Client Secret.
   - `ANTHROPIC_API_KEY`: API Key Anthropic Claude.
   - `ANTHROPIC_MODEL`: `claude-3-5-sonnet-latest`
5. Bấm **Deploy**.
6. **Lưu ý quan trọng sau khi Deploy:**
   - Vào lại Google Cloud Console -> Credentials -> Chỉnh sửa OAuth 2.0 Client ID.
   - Đảm bảo bạn đã thêm URL redirect chính thức: `https://<ten-mien-cua-ban>.vercel.app/api/auth/callback/google` vào danh sách **Authorized redirect URIs**.

---

## 🔒 Bản Quyền & Giấy Phép

Mã nguồn được phân phối dưới giấy phép MIT.
Dữ liệu của người dùng hoàn toàn thuộc quyền sở hữu của người dùng trên Google Drive cá nhân.
