import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Plus, Trash2, Phone, Camera, BookUser } from "lucide-react";
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
      { name: "description", content: "Manage guardians and family members." },
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

const supportsContactPicker =
  typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;

function PeoplePage() {
  const [tab, setTab] = useState<"guardians" | "family">("guardians");

  return (
    <AppShell title="People">
      <div className="flex rounded-lg bg-secondary border border-border p-0.5 mb-5 gap-0.5">
        {(["guardians", "family"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors capitalize ${
              tab === t ? "bg-foreground text-background" : "text-muted-foreground"
            }`}
          >
            {t === "guardians" ? "Guardians" : "Family"}
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

  async function pickFromContacts() {
    try {
      const contacts = await (navigator as any).contacts.select(["name", "tel"], { multiple: false });
      if (contacts.length > 0) {
        const c = contacts[0];
        setName(c.name?.[0] ?? "");
        setPhone(c.tel?.[0] ?? "");
      }
    } catch {}
  }

  function add() {
    if (!name.trim() || !phone.trim()) return;
    setGuardians((g) => [
      ...g,
      { id: uid(), name: name.trim(), phone: phone.trim(), relation: relation.trim() || undefined },
    ]);
    setName(""); setPhone(""); setRelation("");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="bg-card px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Add guardian</p>
          <p className="text-xs text-muted-foreground mt-0.5">These contacts receive your SOS alerts.</p>
        </div>
        <div className="bg-card p-4 space-y-3">
          {supportsContactPicker && (
            <button
              onClick={void pickFromContacts}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-2.5 text-sm font-semibold transition-opacity active:opacity-70"
            >
              <BookUser className="size-4" /> Import from contacts
            </button>
          )}
          <Field label="Name" value={name} onChange={setName} placeholder="Mom" />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" type="tel" />
          <Field label="Relation (optional)" value={relation} onChange={setRelation} placeholder="Mother" />
          <button
            onClick={add}
            disabled={!name.trim() || !phone.trim()}
            className="w-full rounded-lg bg-foreground text-background py-3 font-semibold text-sm disabled:opacity-30 flex items-center justify-center gap-2 transition-opacity"
          >
            <Plus className="size-4" /> Add guardian
          </button>
        </div>
      </section>

      {guardians.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No guardians added yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {guardians.map((g) => (
            <li key={g.id} className="flex items-center gap-3 bg-card px-4 py-3.5">
              <div className="size-9 rounded-full bg-secondary border border-border grid place-items-center font-bold text-sm shrink-0">
                {g.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.relation ? `${g.relation} · ` : ""}{g.phone}</p>
              </div>
              <a
                href={`tel:${g.phone}`}
                aria-label={`Call ${g.name}`}
                className="rounded-lg bg-secondary border border-border p-2.5 shrink-0"
              >
                <Phone className="size-4" />
              </a>
              <button
                aria-label={`Remove ${g.name}`}
                onClick={() => setGuardians((gs) => gs.filter((x) => x.id !== g.id))}
                className="rounded-lg bg-destructive/10 text-destructive p-2.5 shrink-0"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
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
    setPhoto(await fileToDataUrl(f));
  }

  function add() {
    if (!name.trim() || !photo) return;
    setFamily((arr) => [
      ...arr,
      { id: uid(), name: name.trim(), relation: relation.trim() || undefined, photoDataUrl: photo },
    ]);
    setName(""); setRelation(""); setPhoto("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="bg-card px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Register face</p>
          <p className="text-xs text-muted-foreground mt-0.5">VisionAI will identify this person in camera mode.</p>
        </div>
        <div className="bg-card p-4 space-y-3">
          <Field label="Name" value={name} onChange={setName} placeholder="Rahul" />
          <Field label="Relation" value={relation} onChange={setRelation} placeholder="Son" />

          <div>
            <label className="block text-sm font-medium mb-1.5">Photo</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => void onFile(e.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:border file:border-border file:text-foreground file:py-2 file:px-3 file:text-xs file:font-medium"
            />
            {photo && (
              <div className="mt-3 flex items-center gap-3">
                <img src={photo} alt="Preview" className="size-14 rounded-lg object-cover border border-border" />
                <button
                  onClick={() => setPhoto("")}
                  className="text-xs text-destructive font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <button
            onClick={add}
            disabled={!name.trim() || !photo}
            className="w-full rounded-lg bg-foreground text-background py-3 font-semibold text-sm disabled:opacity-30 flex items-center justify-center gap-2 transition-opacity"
          >
            <Camera className="size-4" /> Save member
          </button>
        </div>
      </section>

      {family.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No family members registered yet.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5">
          {family.map((m) => (
            <li key={m.id} className="rounded-xl border border-border bg-card p-3">
              <img
                src={m.photoDataUrl}
                alt={m.name}
                className="aspect-square w-full rounded-lg object-cover"
              />
              <div className="mt-2">
                <p className="font-semibold text-sm truncate">{m.name}</p>
                {m.relation && <p className="text-xs text-muted-foreground">{m.relation}</p>}
              </div>
              <button
                onClick={() => setFamily((arr) => arr.filter((x) => x.id !== m.id))}
                className="mt-2 w-full rounded-md bg-destructive/10 text-destructive py-1.5 text-xs font-medium flex items-center justify-center gap-1"
              >
                <Trash2 className="size-3" /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-input border border-border px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40 transition-shadow"
      />
    </label>
  );
}
