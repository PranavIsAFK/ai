import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useLocalStore, GUARDIANS_KEY, type Guardian } from "@/hooks/useLocalStore";
import { useSpeech } from "@/hooks/useSpeech";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "VisionAI — Emergency SOS" },
      { name: "description", content: "Send your location to guardians and call for help." },
      { property: "og:title", content: "VisionAI — Emergency SOS" },
      { property: "og:description", content: "Send your location to guardians and call for help." },
    ],
  }),
  component: SOSPage,
});

const HOLD_MS = 1500;

function SOSPage() {
  const [guardians] = useLocalStore<Guardian[]>(GUARDIANS_KEY, []);
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const { speak } = useSpeech();

  const getLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setSent("Geolocation not supported on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy });
        setLocating(false);
      },
      (err) => {
        setSent(err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const triggerSOS = useCallback(
    (target?: Guardian) => {
      const link = coords
        ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
        : "(location unavailable)";
      const message = `EMERGENCY — I need help. My location: ${link}`;
      speak("Sending S O S to your guardians.", { interrupt: true });

      const recipients = target ? [target] : guardians;
      if (recipients.length === 0) {
        setSent("No guardians yet. Add a contact in People to send alerts.");
        return;
      }

      // Open SMS to first recipient; chain by opening tel link on tap if available.
      const first = recipients[0];
      const sms = `sms:${first.phone}?&body=${encodeURIComponent(message)}`;
      window.location.href = sms;
      setSent(`Opening SMS to ${first.name}. ${recipients.length > 1 ? `Then send to ${recipients.length - 1} more guardian(s).` : ""}`);
    },
    [coords, guardians, speak],
  );

  const beginHold = useCallback(() => {
    startRef.current = performance.now();
    setHoldProgress(0);
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const pct = Math.min(1, elapsed / HOLD_MS);
      setHoldProgress(pct);
      if (pct >= 1) {
        if (holdRef.current) cancelAnimationFrame(holdRef.current);
        holdRef.current = null;
        triggerSOS();
      } else {
        holdRef.current = requestAnimationFrame(tick);
      }
    };
    holdRef.current = requestAnimationFrame(tick);
  }, [triggerSOS]);

  const cancelHold = useCallback(() => {
    if (holdRef.current) cancelAnimationFrame(holdRef.current);
    holdRef.current = null;
    setHoldProgress(0);
  }, []);

  return (
    <AppShell title="Emergency SOS">
      <div className="space-y-6">
        <div className="rounded-2xl bg-card p-4 flex items-start gap-3">
          <AlertTriangle className="size-6 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">
            Press and hold the red button for 1.5 seconds to send your location to your guardians.
          </p>
        </div>

        <button
          onPointerDown={beginHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          aria-label="Hold to send SOS"
          className="relative w-full aspect-square max-w-xs mx-auto rounded-full bg-destructive text-destructive-foreground font-black text-3xl flex flex-col items-center justify-center select-none overflow-hidden touch-none shadow-xl"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-white/20"
            style={{ clipPath: `inset(${(1 - holdProgress) * 100}% 0 0 0)` }}
          />
          <Phone className="size-12 relative" aria-hidden />
          <span className="relative mt-2">SOS</span>
          <span className="relative text-sm font-medium opacity-90">Hold to send</span>
        </button>

        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><MapPin className="size-5" /> My location</h2>
            <button onClick={getLocation} className="text-sm font-medium text-primary">
              {locating ? <Loader2 className="size-4 animate-spin" /> : "Refresh"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground break-words">
            {coords
              ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (±${Math.round(coords.acc)}m)`
              : locating
              ? "Locating…"
              : "Location unavailable. Grant permission and tap Refresh."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Quick call</h2>
          {guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add guardians in the People tab.</p>
          ) : (
            <ul className="space-y-2">
              {guardians.map((g) => (
                <li key={g.id} className="flex items-center gap-2">
                  <a
                    href={`tel:${g.phone}`}
                    className="flex-1 rounded-xl bg-secondary text-secondary-foreground px-4 py-3 font-semibold min-h-12 flex items-center justify-between"
                  >
                    <span>{g.name}</span>
                    <Phone className="size-5" />
                  </a>
                  <button
                    onClick={() => triggerSOS(g)}
                    className="rounded-xl bg-destructive text-destructive-foreground px-4 py-3 font-semibold min-h-12"
                  >
                    Alert
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {sent && (
          <div role="status" className="rounded-2xl bg-accent text-accent-foreground p-4 text-sm">
            {sent}
          </div>
        )}
      </div>
    </AppShell>
  );
}