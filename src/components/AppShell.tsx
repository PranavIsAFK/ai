import { Link, useLocation } from "@tanstack/react-router";
import { Camera, Home, Phone, Users, Settings as SettingsIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; Icon: LucideIcon };

const NAV: NavItem[] = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/camera", label: "See", Icon: Camera },
  { to: "/sos", label: "SOS", Icon: Phone },
  { to: "/people", label: "People", Icon: Users },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
];

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary grid place-items-center text-primary-foreground font-black">V</div>
          <h1 className="text-xl font-bold tracking-tight">{title ?? "VisionAI"}</h1>
        </div>
      </header>
      <main className="flex-1 px-5 py-6 pb-32">{children}</main>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium min-h-14 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-6" aria-hidden />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}