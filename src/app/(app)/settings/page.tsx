import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/ui/form-skeleton";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { ChangePasswordForm } from "@/features/settings/change-password-form";
import { PreferencesForm } from "@/features/settings/preferences-form";
import { ProfileForm } from "@/features/settings/profile-form";
import { getUserSettings } from "@/features/settings/queries";
import { SettingsSection } from "@/features/settings/settings-section";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

/*
 * The page itself is static. Sections that need the user's data stream in
 * behind their own <Suspense>, so navigating here is instant.
 */
export default function SettingsPage() {
  return (
    <div>
      <SettingsSection title="Profile" description="How you appear in Cove.">
        <Suspense fallback={<FormSkeleton fields={2} />}>
          <ProfileSection />
        </Suspense>
      </SettingsSection>

      <SettingsSection
        title="Targets & preferences"
        description="Your daily protein goal, monthly spending budget, and local timezone."
      >
        <Suspense fallback={<FormSkeleton fields={3} />}>
          <PreferencesSection />
        </Suspense>
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

async function ProfileSection() {
  const user = await requireUser();
  return <ProfileForm name={user.name} email={user.email} />;
}

async function PreferencesSection() {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);
  return (
    <PreferencesForm
      dailyProteinTargetG={settings.dailyProteinTargetG}
      monthlyBudget={settings.monthlyBudget}
      timezone={settings.timezone}
    />
  );
}
