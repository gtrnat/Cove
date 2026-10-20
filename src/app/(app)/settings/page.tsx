import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <EmptyState
      icon={UserRound}
      title="Profile"
      description="Name, password, daily protein target, monthly budget, and timezone. Available after sign-in."
    />
  );
}
