import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechSettings = {
  rate: number; // 0.5 - 2
  voiceURI?: string;
  lang: string;
};

const KEY = "visionai.speech";

function load(): SpeechSettings {
  if (typeof window === "undefined") return { rate: 1, lang: "en-US" };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { rate: 1, lang: "en-US", ...JSON.parse(raw) };
  } catch {}
  return { rate: 1, lang: "en-US" };
}

export function useSpeech() {
  const [settings, setSettings] = useState<SpeechSettings>(() => load());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  const save = useCallback((next: Partial<SpeechSettings>) => {
    setSettings((s) => {
      const v = { ...s, ...next };
      try {
        localStorage.setItem(KEY, JSON.stringify(v));
      } catch {}
      return v;
    });
  }, []);

  const speak = useCallback(
    (text: string, opts?: { interrupt?: boolean }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
      const synth = window.speechSynthesis;
      if (opts?.interrupt) {
        queueRef.current = [];
        synth.cancel();
      }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = settings.rate;
      u.lang = settings.lang;
      const v = voices.find((vv) => vv.voiceURI === settings.voiceURI);
      if (v) u.voice = v;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      synth.speak(u);
    },
    [settings, voices],
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, settings, save, voices };
}