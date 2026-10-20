/** Categories every new account starts with. Users can rename or archive them later. */
export const defaultCategories = [
  { type: "expense", name: "Food & Drinks", icon: "utensils", color: "#e2b55c" },
  { type: "expense", name: "Groceries", icon: "shopping-basket", color: "#9bc48a" },
  { type: "expense", name: "Transport", icon: "car", color: "#7aa7d9" },
  { type: "expense", name: "Shopping", icon: "shopping-bag", color: "#c99ad6" },
  { type: "expense", name: "Bills & Utilities", icon: "receipt", color: "#d9927a" },
  { type: "expense", name: "Entertainment", icon: "clapperboard", color: "#e08aa8" },
  { type: "expense", name: "Health & Fitness", icon: "heart-pulse", color: "#6fcf97" },
  { type: "expense", name: "Other", icon: "circle", color: "#8b8b93" },
  { type: "income", name: "Salary", icon: "briefcase", color: "#6fcf97" },
  { type: "income", name: "Transfer In", icon: "arrow-down-left", color: "#7aa7d9" },
  { type: "income", name: "Other Income", icon: "plus", color: "#8b8b93" },
] as const;

/** Timezones offered in Settings. Indonesia first, then a few common ones. */
export const timezones = [
  { value: "Asia/Jakarta", label: "WIB · Jakarta (UTC+7)" },
  { value: "Asia/Makassar", label: "WITA · Makassar (UTC+8)" },
  { value: "Asia/Jayapura", label: "WIT · Jayapura (UTC+9)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "New York" },
  { value: "UTC", label: "UTC" },
] as const;

export type Timezone = (typeof timezones)[number]["value"];
