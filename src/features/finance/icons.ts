import {
  ArrowDownLeft,
  Baby,
  Book,
  Briefcase,
  Car,
  Circle,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  PawPrint,
  PiggyBank,
  Plane,
  Plus,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/** Icons a category can use. Keys are stored in categories.icon. */
export const categoryIcons = {
  utensils: Utensils,
  coffee: Coffee,
  "shopping-basket": ShoppingBasket,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  car: Car,
  fuel: Fuel,
  plane: Plane,
  home: Home,
  receipt: Receipt,
  wifi: Wifi,
  smartphone: Smartphone,
  clapperboard: Clapperboard,
  "heart-pulse": HeartPulse,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  book: Book,
  gift: Gift,
  baby: Baby,
  "paw-print": PawPrint,
  briefcase: Briefcase,
  "arrow-down-left": ArrowDownLeft,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  plus: Plus,
  circle: Circle,
} satisfies Record<string, LucideIcon>;

export type CategoryIconKey = keyof typeof categoryIcons;

export const categoryIconKeys = Object.keys(categoryIcons) as CategoryIconKey[];

export function categoryIcon(key: string | null | undefined): LucideIcon {
  return (key && categoryIcons[key as CategoryIconKey]) || Circle;
}

/** Muted swatches that sit well on the dark background. */
export const categoryColors = [
  "#e2b55c",
  "#d9927a",
  "#e08aa8",
  "#c99ad6",
  "#9a9de0",
  "#7aa7d9",
  "#6cc4c4",
  "#6fcf97",
  "#9bc48a",
  "#c8b88a",
  "#8b8b93",
] as const;

export const UNCATEGORIZED_COLOR = "#5c5c64";
