import * as React from "react";
import {
  Utensils,
  Car,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Film,
  Coffee,
  PiggyBank,
  Briefcase,
  Coins,
  Tag,
  Smile,
  Gift,
  Plane,
  Smartphone,
  BookOpen,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Film,
  Coffee,
  PiggyBank,
  Briefcase,
  Coins,
  Tag,
  Smile,
  Gift,
  Plane,
  Smartphone,
  BookOpen,
};

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className = "w-4 h-4" }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent className={className} />;
}
