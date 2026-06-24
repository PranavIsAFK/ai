import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Plus, Trash2, UserPlus, Phone, Camera } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  useLocalStore,
  GUARDIANS_KEY,
  FAMILY_KEY,
  type Guardian,
  type FamilyMember,
} from "@/hooks/useLocalStore";

export const Route = createFileRoute("/people")({
  head: () => ({
    meta: [
      { title: "VisionAI — People" },
      { name: "description", content: "Add guardians and register family members for face recognition." },
      { property: "og:title", content: "VisionAI — People" },
      { property: "og:description", content: "Manage guardians and family members." },
    ],
  }),
  component: PeoplePage,
});

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function PeoplePage() {
  const [tab, setTab] = useState<"guardians" | "family">("guardians");
  return (
    <AppShell title="People">
      <div className="grid grid-cols-2 rounded-xl bg-secondary p-1 mb-5">
        {(["guardians", "family"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 rounded-lg font-semibold capitalize ${
              tab === t ? "bg-background text-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "guardians" ? <Guardians /> : <Family />}
    </AppShell>
  );
}

function Guardians() {
  const [guardians, setGuardians] = useLocalStore<Guardian[]>(GUARDIANS_KEY, []);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");

  function add() {
    if (!name.trim() || !phone.trim()) return;
    setGuardians((g) => [...g, { id: uid(), name: name.trim(), phone: phone.trim(), relation: relation.trim() || undefined }]);
    setName("");
    setPhone("");
    setRelation("");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-card p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><UserPlus className="size-5" /> Add guardian</h2>
        <Input label="Name" value={name} onChange={setName} placeholder="Mom" />
        <Input label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 123 4567" type="tel" />
        <Input label="Relation (optional)" value={relation} onChange={setRelation} placeholder="Mother" />
        <button
          onClick={add}
          disabled={!name.trim() || !phone.trim()}
          className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold min-h-12 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus className="size-5" /> Add guardian
        </button>
      </section>

      <ul className="space-y-2">
        {guardians.length === 0 && (
          <li className="text-sm text-muted-foreground">No guardians yet.</li>
        )}
        {guardians.map((g) => (
          <li key={g.id} className="rounded-2xl bg-card p-4 flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/20 text-primary grid place-items-center font-bold">
              {g.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{g.name}</div>
              <div className="text-sm text-muted-foreground truncate">
                {g.relation ? `${g.relation} · ` : ""}
                {g.phone}
              </div>
            </div>
            <a href={`tel:${g.phone}`} aria-label={`Call ${g.name}`} className="rounded-lg bg-secondary p-3">
              <Phone className="size-5" />
            </a>
            <button
              aria-label={`Remove ${g.name}`}
              onClick={() => setGuardians((gs) => gs.filter((x) => x.id !== g.id))}
              className="rounded-lg bg-destructive/20 text-destructive p-3"
            >
              <Trash2 className="size-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Family() {
  const [family, setFamily] = useLocalStore<FamilyMember[]>(FAMILY_KEY, []);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onFile(f: File | undefined) {
    if (!f) return;
    const url = await fileToDataUrl(f);
    setPhoto(url);
  }

  function add() {
    if (!name.trim() || !photo) return;
    setFamily((arr) => [...arr, { id: uid(), name: name.trim(), relation: relation.trim() || undefined, photoDataUrl: photo }]);
    setName("");
    setRelation("");
    setPhoto("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-card p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Camera className="size-5" /> Register family member</h2>
        <Input label="Name" value={name} onChange={setName} placeholder="Rahul" />
        <Input label="Relation" value={relation} onChange={setRelation} placeholder="Son" />
        <div>
          <label className="block text-sm font-medium mb-1">Photo</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => void onFile(e.target.files?.[0])}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:text-secondary-foreground file:py-2 file:px-3"
          />
          {photo && (
            <img src={photo} alt="Preview" className="mt-3 size-24 rounded-xl object-cover" />
          )}
        </div>
        <button
          onClick={add}
          disabled={!name.trim() || !photo}
          className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold min-h-12 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus className="size-5" /> Save
        </button>
        <p className="text-xs text-muted-foreground">
          The name and relation are sent with the camera frame so VisionAI can recognise this person when they appear.
        </p>
      </section>

      <ul className="grid grid-cols-2 gap-3">
        {family.map((m) => (
          <li key={m.id} className="rounded-2xl bg-card p-3">
            <img src={m.photoDataUrl} alt={m.name} className="aspect-square w-full rounded-xl object-cover" />
            <div className="mt-2 font-semibold truncate">{m.name}</div>
            {m.relation && <div className="text-xs text-muted-foreground truncate">{m.relation}</div>}
            <button
              onClick={() => setFamily((arr) => arr.filter((x) => x.id !== m.id))}
              className="mt-2 w-full rounded-lg bg-destructive/20 text-destructive py-2 text-sm font-medium flex items-center justify-center gap-1"
            >
              <Trash2 className="size-4" /> Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-input/60 border border-border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring min-h-12"
      />
    </label>
  );
}