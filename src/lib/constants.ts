import { Category, Settings } from "@/types/models";

export const DEFAULT_CATEGORIES: Category[] = [
  // Chi phí thiết yếu (Needs)
  {
    id: "cat_an_uong",
    name: "Ăn uống",
    icon: "Utensils",
    color: "#f97316", // Orange
    type: "expense",
    group: "needs",
    monthlyBudget: 3500000,
  },
  {
    id: "cat_di_lai",
    name: "Đi lại & Xăng xe",
    icon: "Car",
    color: "#3b82f6", // Blue
    type: "expense",
    group: "needs",
    monthlyBudget: 1000000,
  },
  {
    id: "cat_nha_o",
    name: "Nhà ở & Tiền phòng",
    icon: "Home",
    color: "#6366f1", // Indigo
    type: "expense",
    group: "needs",
    monthlyBudget: 4000000,
  },
  {
    id: "cat_hoa_don",
    name: "Hóa đơn & Dịch vụ",
    icon: "Zap",
    color: "#eab308", // Yellow
    type: "expense",
    group: "needs",
    monthlyBudget: 1200000,
  },
  {
    id: "cat_suc_khoe",
    name: "Sức khỏe & Y tế",
    icon: "HeartPulse",
    color: "#ef4444", // Red
    type: "expense",
    group: "needs",
    monthlyBudget: 500000,
  },
  {
    id: "cat_giao_duc",
    name: "Giáo dục & Học tập",
    icon: "GraduationCap",
    color: "#8b5cf6", // Purple
    type: "expense",
    group: "needs",
    monthlyBudget: 1000000,
  },

  // Chi tiêu linh hoạt / sở thích (Wants)
  {
    id: "cat_mua_sam",
    name: "Mua sắm & Quần áo",
    icon: "ShoppingBag",
    color: "#ec4899", // Pink
    type: "expense",
    group: "wants",
    monthlyBudget: 1500000,
  },
  {
    id: "cat_giai_tri",
    name: "Giải trí & Phim ảnh",
    icon: "Film",
    color: "#14b8a6", // Teal
    type: "expense",
    group: "wants",
    monthlyBudget: 800000,
  },
  {
    id: "cat_cafe",
    name: "Cafe & Tụ tập",
    icon: "Coffee",
    color: "#06b6d4", // Cyan
    type: "expense",
    group: "wants",
    monthlyBudget: 800000,
  },

  // Tiết kiệm & Tích lũy (Savings)
  {
    id: "cat_tiet_kiem",
    name: "Tiết kiệm & Đầu tư",
    icon: "PiggyBank",
    color: "#10b981", // Emerald
    type: "expense",
    group: "savings",
    monthlyBudget: 3000000,
  },

  // Thu nhập (Income)
  {
    id: "cat_luong",
    name: "Tiền lương",
    icon: "Briefcase",
    color: "#059669", // Dark Green
    type: "income",
    group: "income",
  },
  {
    id: "cat_thu_nhap_khac",
    name: "Thu nhập khác",
    icon: "Coins",
    color: "#16a34a", // Light Green
    type: "income",
    group: "income",
  },
];

export const DEFAULT_SETTINGS: Settings = {
  currency: "VND",
  monthStartDay: 1,
  budgetRule: "50/30/20",
  emergencyFundTarget: 50000000,
  saveReceiptImages: false,
};
