import {
  Dumbbell,
  LayoutGrid,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type SubNavItem = {
  label: string;
  href: string;
};

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: "Fitness", href: "/fitness", icon: Dumbbell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const financeNav: SubNavItem[] = [
  { label: "Overview", href: "/finance" },
  { label: "Transactions", href: "/finance/transactions" },
  { label: "Budgets", href: "/finance/budgets" },
  { label: "Rules", href: "/finance/rules" },
];

export const fitnessNav: SubNavItem[] = [
  { label: "Overview", href: "/fitness" },
  { label: "History", href: "/fitness/history" },
  { label: "Running", href: "/fitness/running" },
  { label: "Nutrition", href: "/fitness/nutrition" },
  { label: "Foods", href: "/fitness/foods" },
];

export const settingsNav: SubNavItem[] = [
  { label: "Profile", href: "/settings" },
  { label: "Integrations", href: "/settings/integrations" },
];

/**
 * A section root (e.g. /finance) is only active on an exact match when it is a
 * tab, so "Overview" doesn't stay highlighted on /finance/transactions.
 */
export function isActive(pathname: string | null, href: string, exact = false) {
  if (!pathname) return false;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
