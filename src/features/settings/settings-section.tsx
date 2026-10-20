type SettingsSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

/** Two-column settings row: label on the left, form on the right (stacked on mobile). */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className="grid gap-6 border-b py-8 first:pt-0 last:border-b-0 lg:grid-cols-[280px_1fr] lg:gap-12"
    >
      <div>
        <h2 id={id} className="text-[15px] font-medium">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-muted">{description}</p>
      </div>
      <div className="max-w-lg">{children}</div>
    </section>
  );
}
