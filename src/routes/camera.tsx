import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, Loader2, Pause, Play, Volume2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSpeech } from "@/hooks/useSpeech";
import { FAMILY_KEY, type FamilyMember } from "@/hooks/useLocalStore";
import { describeScene } from "@/lib/vision.functions";

export const Route = createFileRoute("/camera")({
  head: () => ({
    meta: [
      { title: "VisionAI — See" },
      { name: "description", content: "Live AI scene description from your camera." },
      { property: "og:title", content: "VisionAI — See" },
      { property: "og:description", content: "Live AI scene description from your camera." },
    ],
  }),
  component: CameraPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <AppShell title="See">
        <div className="space-y-4">
          <p className="text-destructive font-medium">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-semibold"
          >
            Try again
          </button>
        </div>
      </AppShell>
    );
  },
  notFoundComponent: () => <AppShell title="See"><p>Not found.</p></AppShell>,
});

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastText, setLastText] = useState<string>("Tap describe to hear what's in front of you.");
  const { speak, stop, speaking } = useSpeech();

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setReady(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied.");
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureAndDescribe = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || busy) return;
    setBusy(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const w = Math.min(640, video.videoWidth || 640);
      const h = Math.round((w / (video.videoWidth || 640)) * (video.videoHeight || 480));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

      let knownPeople: FamilyMember[] = [];
      try {
        const raw = localStorage.getItem(FAMILY_KEY);
        if (raw) knownPeople = JSON.parse(raw) as FamilyMember[];
      } catch {}

      const { text } = await describeScene({
        data: {
          imageDataUrl: dataUrl,
          knownPeople: knownPeople.map((p) => ({ name: p.name, relation: p.relation, photoDataUrl: p.photoDataUrl })),
        },
      });
      if (text) {
        setLastText(text);
        speak(text, { interrupt: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not describe scene.";
      setLastText(msg);
      speak(msg, { interrupt: true });
    } finally {
      setBusy(false);
    }
  }, [busy, speak]);

  // Auto-describe loop: every 6s while enabled.
  useEffect(() => {
    if (!auto || !ready) return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled) {
        await captureAndDescribe();
        await new Promise((r) => setTimeout(r, 6000));
      }
    };
    void loop();
    return () => {
      cancelled = true;
    };
  }, [auto, ready, captureAndDescribe]);

  return (
    <AppShell title="See">
      <div className="space-y-4">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-black">
          <video ref={videoRef} muted playsInline className="absolute inset-0 size-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {!ready && !error && (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin" />
                <span>Starting camera…</span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <p className="font-semibold">Camera unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <button
                  onClick={() => void startCamera()}
                  className="mt-4 rounded-xl bg-primary text-primary-foreground px-4 py-2 font-semibold"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          {busy && (
            <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" /> Analyzing
            </div>
          )}
        </div>

        <div
          aria-live="polite"
          className="rounded-2xl bg-card p-4 min-h-24 text-lg leading-snug"
        >
          {lastText}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => void captureAndDescribe()}
            disabled={!ready || busy}
            className="rounded-2xl bg-primary text-primary-foreground py-5 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 min-h-16"
          >
            <CameraIcon className="size-6" /> Describe
          </button>
          <button
            onClick={() => setAuto((a) => !a)}
            disabled={!ready}
            className={`rounded-2xl py-5 text-lg font-bold flex items-center justify-center gap-2 min-h-16 ${
              auto ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {auto ? <Pause className="size-6" /> : <Play className="size-6" />}
            {auto ? "Stop auto" : "Auto"}
          </button>
        </div>

        <button
          onClick={() => (speaking ? stop() : speak(lastText, { interrupt: true }))}
          className="w-full rounded-2xl bg-accent text-accent-foreground py-4 font-semibold flex items-center justify-center gap-2 min-h-14"
        >
          <Volume2 className="size-5" />
          {speaking ? "Stop speaking" : "Repeat aloud"}
        </button>
      </div>
    </AppShell>
  );
}