import { createFileRoute } from "@tanstack/react-router";
import { Volume2, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSpeech } from "@/hooks/useSpeech";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "VisionAI — Settings" },
      { name: "description", content: "Adjust voice and speech settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, save, voices, speak } = useSpeech();
  const [tested, setTested] = useState(false);

  function testVoice() {
    speak("VisionAI is ready. Tap See to describe your surroundings.", { interrupt: true });
    setTested(true);
    setTimeout(() => setTested(false), 2000);
  }

  return (
    <AppShell title="Settings">
      <div className="space-y-3">
        {/* Speech rate */}
        <section className="rounded-xl border border-border overflow-hidden">
          <div className="bg-card px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold">Speech rate</p>
            <span className="text-sm font-bold tabular-nums bg-secondary border border-border px-2.5 py-0.5 rounded-md">
              {settings.rate.toFixed(1)}×
            </span>
          </div>
          <div className="bg-card px-4 py-4 space-y-2">
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={settings.rate}
              onChange={(e) => save({ rate: Number(e.target.value) })}
              className="w-full accent-foreground h-1"
              aria-label="Speech rate"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow (0.5×)</span>
              <span>Fast (2×)</span>
            </div>
          </div>
        </section>

        {/* Voice selection */}
        <section className="rounded-xl border border-border overflow-hidden">
          <div className="bg-card px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Voice</p>
          </div>
          <div className="bg-card p-4 space-y-3">
            <select
              value={settings.voiceURI ?? ""}
              onChange={(e) =>
                save({
                  voiceURI: e.target.value || undefined,
                  lang: voices.find((v) => v.voiceURI === e.target.value)?.lang ?? settings.lang,
                })
              }
              className="w-full rounded-lg bg-input border border-border px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              aria-label="Voice"
            >
              <option value="">System default</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <button
              onClick={testVoice}
              className="w-full rounded-lg bg-foreground text-background py-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition-opacity active:opacity-70"
            >
              {tested ? <Check className="size-4" /> : <Volume2 className="size-4" />}
              {tested ? "Playing…" : "Test voice"}
            </button>
          </div>
        </section>

        {/* About */}
        <section className="rounded-xl border border-border overflow-hidden">
          <div className="bg-card px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">About</p>
          </div>
          <div className="bg-card px-4 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">AI provider</span>
              <span className="font-medium">Groq (Llama 4)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data storage</span>
              <span className="font-medium">On-device only</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Camera data</span>
              <span className="font-medium">Not stored</span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
