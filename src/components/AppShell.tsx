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
      <header className="sticky top-0 z-20 bg-background border-b border-border pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 px-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <span className="text-base font-bold tracking-tight">VisionAI</span>
          {title && (
            <>
              <span className="text-border">/</span>
              <span className="text-base font-medium text-muted-foreground truncate">{title}</span>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 py-5 pb-28">
        <div className="max-w-lg mx-auto w-full">{children}</div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 bg-background border-t border-border pb-[max(env(safe-area-inset-bottom),0.25rem)]"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-1">
          {NAV.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            const isSOS = to === "/sos";
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium min-h-14 w-full transition-colors ${
                    isSOS
                      ? active
                        ? "text-destructive"
                        : "text-destructive/60"
                      : active
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  <Icon className={`size-5 ${active ? "stroke-[2.5px]" : "stroke-2"}`} aria-hidden />
                  <span className={active ? "font-semibold" : ""}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
