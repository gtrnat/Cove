import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-80 max-w-xl rounded-full bg-accent/[0.06] blur-3xl"
      />
      <header className="flex h-16 items-center px-6">
        <Link href="/" aria-label="Cove home" className="rounded-md">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-6 pb-20 pt-10 md:items-center md:pt-0">
        <div className="animate-fade-up w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
