import { PageHeader } from "@/components/layout/page-header";
import { settingsNav } from "@/config/nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" description="Your profile, targets, and integrations." tabs={settingsNav} />
      {children}
    </>
  );
}
