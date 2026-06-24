import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useSpeech } from "@/hooks/useSpeech";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "VisionAI — Settings" },
      { name: "description", content: "Adjust voice, speech rate, and language for VisionAI." },
      { property: "og:title", content: "VisionAI — Settings" },
      { property: "og:description", content: "Adjust voice, speech rate, and language." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, save, voices, speak } = useSpeech();

  return (
    <AppShell title="Settings">
      <div className="space-y-6">
        <section className="rounded-2xl bg-card p-4 space-y-4">
          <h2 className="font-semibold">Speech rate</h2>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={settings.rate}
            onChange={(e) => save({ rate: Number(e.target.value) })}
            className="w-full accent-primary"
            aria-label="Speech rate"
          />
          <div className="text-sm text-muted-foreground">Current: {settings.rate.toFixed(1)}×</div>
        </section>

        <section className="rounded-2xl bg-card p-4 space-y-3">
          <h2 className="font-semibold">Voice</h2>
          <select
            value={settings.voiceURI ?? ""}
            onChange={(e) => save({ voiceURI: e.target.value || undefined, lang: voices.find((v) => v.voiceURI === e.target.value)?.lang ?? settings.lang })}
            className="w-full rounded-xl bg-input/60 border border-border px-4 py-3 min-h-12"
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
            onClick={() => speak("VisionAI is ready. Tap See to describe your surroundings.", { interrupt: true })}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold min-h-12"
          >
            Test voice
          </button>
        </section>

        <section className="rounded-2xl bg-card p-4 text-sm text-muted-foreground space-y-2">
          <p>
            VisionAI is a web prototype. Guardians and family photos are stored only on this
            device. Camera frames are sent to the AI service for scene description.
          </p>
        </section>
      </div>
    </AppShell>
  );
}