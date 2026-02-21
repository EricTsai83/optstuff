import { LogoIcon } from "@workspace/ui/components/logo";
import Link from "next/link";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="bg-background absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(var(--accent-rgb,120,200,170),0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_0%_100%,rgba(var(--primary-rgb,80,80,100),0.08),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <LogoIcon size={32} />
        <span className="text-lg font-semibold">OptStuff</span>
      </Link>

      {/* Auth content */}
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md duration-500">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-muted-foreground shrink-0 py-6 text-center text-xs">
        <p>
          By continuing, you agree to our{" "}
          <Link href="/terms" className="hover:text-foreground underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:text-foreground underline">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}
