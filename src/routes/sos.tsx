import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, MapPin, Loader2, MessageSquare, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useLocalStore, GUARDIANS_KEY, type Guardian } from "@/hooks/useLocalStore";
import { useSpeech } from "@/hooks/useSpeech";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "VisionAI — SOS" },
      { name: "description", content: "Emergency SOS." },
    ],
  }),
  component: SOSPage,
});

const HOLD_MS = 2000;
const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

function SOSPage() {
  const [guardians] = useLocalStore<Guardian[]>(GUARDIANS_KEY, []);
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const { speak } = useSpeech();

  const getLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : null;

  const sosMessage = `EMERGENCY — I need help! My location: ${mapsLink ?? "unavailable"}`;

  const sendSMSToAll = useCallback(() => {
    if (guardians.length === 0) {
      setStatus("No guardians added. Go to People to add emergency contacts.");
      return;
    }
    speak("Sending emergency alert.", { interrupt: true });
    const first = guardians[0];
    window.location.href = `sms:${first.phone}${/iPhone|iPad|Mac/.test(navigator.userAgent) ? "&" : "?"}body=${encodeURIComponent(sosMessage)}`;
    setStatus(
      guardians.length > 1
        ? `SMS opened for ${first.name}. Open this page again to send to the remaining ${guardians.length - 1} contact${guardians.length > 2 ? "s" : ""}.`
        : `SMS opened for ${first.name}.`
    );
  }, [guardians, sosMessage, speak]);

  const shareLocation = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Emergency — I need help!", text: sosMessage });
      } catch {}
      return;
    }
    sendSMSToAll();
  }, [sosMessage, sendSMSToAll]);

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
        sendSMSToAll();
      } else {
        holdRef.current = requestAnimationFrame(tick);
      }
    };
    holdRef.current = requestAnimationFrame(tick);
  }, [sendSMSToAll]);

  const cancelHold = useCallback(() => {
    if (holdRef.current) cancelAnimationFrame(holdRef.current);
    holdRef.current = null;
    setHoldProgress(0);
  }, []);

  return (
    <AppShell title="SOS">
      <div className="space-y-5">
        {/* Hold button */}
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            onPointerDown={beginHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            aria-label="Hold 2 seconds to send SOS to all guardians"
            className="relative size-48 rounded-full bg-destructive text-white flex flex-col items-center justify-center select-none touch-none active:scale-95 transition-transform"
          >
            <svg
              className="absolute inset-0 size-full"
              viewBox="0 0 100 100"
              aria-hidden
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle cx="50" cy="50" r={RING_R} fill="none" stroke="white" strokeWidth="4" strokeOpacity="0.15" />
              <circle
                cx="50" cy="50" r={RING_R}
                fill="none" stroke="white" strokeWidth="4"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - holdProgress)}
                strokeLinecap="round"
              />
            </svg>
            <Phone className="size-9 relative z-10" aria-hidden />
            <span className="relative z-10 text-2xl font-black mt-1">SOS</span>
            <span className="relative z-10 text-xs font-medium opacity-70 mt-0.5">Hold 2 seconds</span>
          </button>
          <p className="text-xs text-muted-foreground">
            {holdProgress > 0 ? "Keep holding…" : "Sends SMS to all guardians"}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={shareLocation}
            className="flex items-center justify-center gap-2 rounded-xl bg-destructive text-white py-3.5 font-semibold text-sm min-h-12"
          >
            <MessageSquare className="size-4" /> Share location
          </button>
          {guardians[0] ? (
            <a
              href={`tel:${guardians[0].phone}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-secondary border border-border text-foreground py-3.5 font-semibold text-sm min-h-12"
            >
              <Phone className="size-4" /> Call {guardians[0].name.split(" ")[0]}
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary border border-border text-muted-foreground py-3.5 text-sm min-h-12">
              No guardian set
            </div>
          )}
        </div>

        {/* Location */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Location
            </p>
            <button
              onClick={getLocation}
              className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md min-h-6 flex items-center"
            >
              {locating ? <Loader2 className="size-3 animate-spin" /> : "Refresh"}
            </button>
          </div>
          {coords ? (
            <div>
              <p className="text-sm font-mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Accuracy ±{Math.round(coords.acc)} m</p>
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-foreground underline mt-1 inline-block"
                >
                  Open in Maps
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {locating ? "Getting location…" : "Location unavailable — grant permission and refresh."}
            </p>
          )}
        </div>

        {/* Guardian list */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Guardians</p>
          {guardians.length === 0 ? (
            <div className="rounded-xl border border-border p-5 flex items-start gap-3">
              <AlertTriangle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                No guardians added. Go to <strong>People</strong> to add emergency contacts.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {guardians.map((g) => (
                <li key={g.id} className="flex items-center gap-3 bg-card px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.relation ? `${g.relation} · ` : ""}{g.phone}</p>
                  </div>
                  <a
                    href={`sms:${g.phone}${/iPhone|iPad|Mac/.test(navigator.userAgent) ? "&" : "?"}body=${encodeURIComponent(sosMessage)}`}
                    className="rounded-lg bg-secondary border border-border px-3 py-2 text-xs font-semibold shrink-0"
                  >
                    SMS
                  </a>
                  <a
                    href={`tel:${g.phone}`}
                    aria-label={`Call ${g.name}`}
                    className="rounded-lg bg-destructive text-white px-3 py-2 text-xs font-semibold shrink-0"
                  >
                    Call
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {status && (
          <div role="status" className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {status}
          </div>
        )}
      </div>
    </AppShell>
  );
}
