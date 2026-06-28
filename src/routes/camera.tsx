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
      { name: "description", content: "Live AI scene description." },
    ],
  }),
  component: CameraPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <AppShell title="See">
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-5 space-y-4">
          <p className="text-destructive font-medium text-sm">{error.message}</p>
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-lg bg-foreground text-background px-5 py-3 font-semibold text-sm"
          >
            Try again
          </button>
        </div>
      </AppShell>
    );
  },
});

function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastText, setLastText] = useState<string>("Tap Describe to hear what's around you.");
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

  useEffect(() => {
    if (!auto || !ready) return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled) {
        await captureAndDescribe();
        await new Promise((r) => setTimeout(r, 12000));
      }
    };
    void loop();
    return () => { cancelled = true; };
  }, [auto, ready, captureAndDescribe]);

  return (
    <AppShell title="See">
      <div className="space-y-3">
        {/* Camera view */}
        <div className="relative w-full max-h-[52vh] aspect-[3/4] overflow-hidden rounded-xl bg-black border border-border">
          <video ref={videoRef} muted playsInline className="absolute inset-0 size-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {!ready && !error && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-3 text-white/50">
                <Loader2 className="size-7 animate-spin" />
                <span className="text-sm">Starting camera…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 grid place-items-center p-6">
              <div className="text-center space-y-3">
                <p className="font-semibold text-white">Camera unavailable</p>
                <p className="text-sm text-white/60">{error}</p>
                <button
                  onClick={() => void startCamera()}
                  className="rounded-lg bg-white text-black px-5 py-2.5 font-semibold text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {busy && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
              <Loader2 className="size-3 animate-spin" /> Analyzing
            </div>
          )}

          {auto && !busy && ready && (
            <div className="absolute left-3 top-3 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-white tracking-wide">
              AUTO
            </div>
          )}
        </div>

        {/* AI output */}
        <div aria-live="polite" className="rounded-xl bg-card border border-border p-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Scene</p>
          <p className="text-sm leading-relaxed">{lastText}</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => void captureAndDescribe()}
            disabled={!ready || busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-foreground text-background py-4 text-sm font-bold min-h-14 disabled:opacity-30 transition-opacity"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CameraIcon className="size-4" />}
            {busy ? "Analyzing" : "Describe"}
          </button>
          <button
            onClick={() => setAuto((a) => !a)}
            disabled={!ready}
            className={`flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold min-h-14 disabled:opacity-30 transition-colors border ${
              auto
                ? "bg-destructive/10 text-destructive border-destructive/30"
                : "bg-secondary text-foreground border-border"
            }`}
          >
            {auto ? <Pause className="size-4" /> : <Play className="size-4" />}
            {auto ? "Stop auto" : "Auto"}
          </button>
        </div>

        <button
          onClick={() => (speaking ? stop() : speak(lastText, { interrupt: true }))}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary text-foreground py-3.5 text-sm font-semibold min-h-12 border border-border transition-opacity active:opacity-70"
        >
          <Volume2 className="size-4" />
          {speaking ? "Stop speaking" : "Repeat aloud"}
        </button>
      </div>
    </AppShell>
  );
}
