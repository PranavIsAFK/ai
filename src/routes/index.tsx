import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Phone, Users, Settings as SettingsIcon, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VisionAI — Home" },
      { name: "description", content: "Tap See to describe your surroundings, or SOS for emergency help." },
      { property: "og:title", content: "VisionAI — Home" },
      { property: "og:description", content: "AI-powered scene description and emergency SOS." },
    ],
  }),
  component: Index,
});

type Tile = { to: string; title: string; subtitle: string; Icon: LucideIcon; tone?: "primary" | "danger" | "accent" };

const TILES: Tile[] = [
  { to: "/camera", title: "Describe surroundings", subtitle: "Point the camera. Hear what's around you.", Icon: Camera, tone: "primary" },
  { to: "/sos", title: "Emergency SOS", subtitle: "Share location with your guardians.", Icon: Phone, tone: "danger" },
  { to: "/people", title: "Guardians & family", subtitle: "Add contacts and register faces.", Icon: Users, tone: "accent" },
  { to: "/settings", title: "Voice & language", subtitle: "Adjust speech speed and voice.", Icon: SettingsIcon },
];

function Index() {
  return (
    <AppShell title="VisionAI">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-primary">Welcome</p>
        <h2 className="text-3xl font-bold leading-tight">Hello. What can I help you with?</h2>
        <p className="text-base text-muted-foreground">Large buttons below. Tap and hold any tile to hear it read aloud.</p>
      </section>

      <div className="mt-8 grid gap-4">
        {TILES.map(({ to, title, subtitle, Icon, tone }) => (
          <Link
            key={to}
            to={to}
            aria-label={`${title}. ${subtitle}`}
            className={`group flex items-center gap-4 rounded-2xl border border-border/70 p-5 min-h-24 transition-colors ${
              tone === "primary"
                ? "bg-primary text-primary-foreground border-transparent"
                : tone === "danger"
                ? "bg-destructive text-destructive-foreground border-transparent"
                : tone === "accent"
                ? "bg-accent text-accent-foreground border-transparent"
                : "bg-card"
            }`}
          >
            <div className="grid place-items-center size-14 rounded-xl bg-black/20">
              <Icon className="size-8" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold leading-tight">{title}</div>
              <div className="text-sm opacity-90">{subtitle}</div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
