import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Phone, Users, Settings as SettingsIcon, ChevronRight, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VisionAI" },
      { name: "description", content: "AI-powered vision assistance." },
    ],
  }),
  component: Index,
});

type Item = { to: string; label: string; description: string; Icon: LucideIcon; emergency?: boolean };

const ITEMS: Item[] = [
  {
    to: "/camera",
    label: "Describe surroundings",
    description: "Point your camera to hear what's around you.",
    Icon: Camera,
  },
  {
    to: "/sos",
    label: "Emergency SOS",
    description: "Call or alert your guardians immediately.",
    Icon: Phone,
    emergency: true,
  },
  {
    to: "/people",
    label: "Guardians & family",
    description: "Manage contacts and register faces.",
    Icon: Users,
  },
  {
    to: "/settings",
    label: "Voice settings",
    description: "Adjust speech speed and voice.",
    Icon: SettingsIcon,
  },
];

function Index() {
  return (
    <AppShell>
      <div className="mb-7">
        <h2 className="text-3xl font-bold tracking-tight">Hello.</h2>
        <p className="mt-1.5 text-muted-foreground">What do you need help with?</p>
      </div>

      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
        {ITEMS.map(({ to, label, description, Icon, emergency }) => (
          <Link
            key={to}
            to={to}
            aria-label={`${label}. ${description}`}
            className={`flex items-center gap-4 bg-card px-4 py-4 min-h-[72px] transition-colors active:bg-secondary ${
              emergency ? "active:bg-destructive/10" : ""
            }`}
          >
            <Icon
              className={`size-5 shrink-0 ${emergency ? "text-destructive" : "text-muted-foreground"}`}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${emergency ? "text-destructive" : ""}`}>{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" aria-hidden />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
