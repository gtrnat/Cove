import type { Metadata } from "next";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { ChangePasswordForm } from "@/features/settings/change-password-form";
import { PreferencesForm } from "@/features/settings/preferences-form";
import { ProfileForm } from "@/features/settings/profile-form";
import { getUserSettings } from "@/features/settings/queries";
import { SettingsSection } from "@/features/settings/settings-section";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);

  return (
    <div>
      <SettingsSection title="Profile" description="How you appear in Cove.">
        <ProfileForm name={user.name} email={user.email} />
      </SettingsSection>

      <SettingsSection
        title="Targets & preferences"
        description="Your daily protein goal, monthly spending budget, and local timezone."
      >
        <PreferencesForm
          dailyProteinTargetG={settings.dailyProteinTargetG}
          monthlyBudget={settings.monthlyBudget}
          timezone={settings.timezone}
        />
      </SettingsSection>

      <SettingsSection
        title="Password"
        description="Changing your password signs you out on every other device."
      >
        <ChangePasswordForm />
      </SettingsSection>

      <SettingsSection title="Session" description="Sign out of Cove on this device.">
        <SignOutButton variant="outline" />
      </SettingsSection>
    </div>
  );
}
