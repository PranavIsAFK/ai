import { useCallback, useEffect, useState } from "react";

export function useLocalStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {}
    setHydrated(true);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(v));
        } catch {}
        return v;
      });
    },
    [key],
  );

  return [value, update, hydrated] as const;
}

export type Guardian = { id: string; name: string; phone: string; relation?: string };
export type FamilyMember = { id: string; name: string; relation?: string; photoDataUrl: string };

export const GUARDIANS_KEY = "visionai.guardians";
export const FAMILY_KEY = "visionai.family";