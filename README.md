# VisionAI 👁️‍🗨️

**AI-powered vision assistance for people who are blind or have low vision.**
Point your phone at the world and hear what's in front of you, reach your
guardians instantly in an emergency, and register the faces of the people you
care about — all from one calm, high-contrast, voice-first interface.

<p>
  <img alt="TanStack Start" src="https://img.shields.io/badge/TanStack-Start-ff4154?logo=react&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white">
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white">
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&logoColor=white">
</p>

---

## What it does

VisionAI is a mobile-first web app organised around four large, thumb-friendly
actions:

| Feature | Route | What happens |
| --- | --- | --- |
| 📷 **Describe surroundings** | `/camera` | Captures a frame from the camera and sends it to a vision model, which replies in one or two short spoken sentences — hazards first, then people, then context. |
| 🆘 **Emergency SOS** | `/sos` | One tap to call or alert the guardians you've saved. |
| 👥 **Guardians & family** | `/people` | Manage emergency contacts and register the faces/names of people you know. |
| ⚙️ **Voice settings** | `/settings` | Tune speech rate and pick a voice. |

### Designed for accessibility, not bolted on

- **Voice-first output** using the browser's built-in
  [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) —
  no cloud TTS round-trip, adjustable rate, and settings persisted locally.
- **Hazard-prioritised descriptions.** The vision prompt is tuned to lead with
  immediate dangers (vehicles, stairs, traffic lights), then people and their
  position ("ahead", "to your left"), then helpful context — capped at ~30
  words so it's quick to hear.
- **Optional face recognition.** Register the people around you; if the model is
  confident a registered face is visible, it names them.
- **Large tap targets, high contrast, full `aria` labelling** throughout.

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** — full-stack React framework
  with file-based routing and server functions.
- **React 19** + **TypeScript**.
- **[Tailwind CSS v4](https://tailwindcss.com/)** + **[shadcn/ui](https://ui.shadcn.com/)**
  (Radix primitives) for the component system.
- **[Vite](https://vitejs.dev/)** for dev/build; **Cloudflare Workers** as the
  deploy target (see [`wrangler.toml`](wrangler.toml)).
- **AI vision backends** (pluggable, server-side):
  - **[Groq](https://console.groq.com/)** — `meta-llama/llama-4-scout-17b-16e-instruct` (free tier, used first if a key is present)
  - **[Google Gemini](https://ai.google.dev/)** — `gemini-2.0-flash` (fallback)

> This project was bootstrapped and is synced with
> [Lovable](https://lovable.dev) — see [`AGENTS.md`](AGENTS.md). Commits pushed
> to the connected branch appear in the Lovable editor, so avoid rewriting
> published history.

## Getting started

### Prerequisites

- **[Bun](https://bun.sh/)** (the repo ships a [`bunfig.toml`](bunfig.toml)) or Node.js 18+
- A free API key from **[Groq](https://console.groq.com/keys)** _or_ **[Google AI Studio](https://aistudio.google.com/app/apikey)**

### Install & run

```bash
bun install          # or: npm install

# Add your vision API key
echo "GROQ_API_KEY=your_key_here" > .env.local
# ...or use GEMINI_API_KEY=your_key_here instead

bun run dev          # or: npm run dev
```

Open the printed local URL. For camera access on a phone you'll need a secure
context (`https://` or `localhost`).

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | one of the two | Groq vision model (tried first) |
| `GEMINI_API_KEY` | one of the two | Google Gemini vision model (fallback) |

If neither key is set, the describe-scene server function returns a clear error
telling you to add one.

## Scripts

| Command | Description |
| --- | --- |
| `dev` | Start the Vite dev server |
| `build` | Production build (runs a Cloudflare patch step afterwards) |
| `preview` | Preview the production build locally |
| `lint` | Run ESLint |
| `format` | Format with Prettier |

## Project structure

```
src/
├── routes/                 # File-based routes (TanStack Start)
│   ├── __root.tsx          # App shell wrapping every page
│   ├── index.tsx           # Home menu (the four actions)
│   ├── camera.tsx          # Describe-surroundings screen
│   ├── sos.tsx             # Emergency SOS
│   ├── people.tsx          # Guardians & face registration
│   └── settings.tsx        # Voice settings
├── components/
│   ├── AppShell.tsx        # Shared layout/chrome
│   └── ui/                 # shadcn/ui components
├── hooks/
│   ├── useSpeech.ts        # Web Speech API wrapper + persisted settings
│   └── useLocalStore.ts    # localStorage-backed state
├── lib/
│   └── vision.functions.ts # `describeScene` server fn (Groq / Gemini)
├── router.tsx / server.ts / start.ts
└── styles.css
```

## Deployment

The app targets **Cloudflare Workers**. After `bun run build`, deploy with
[Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```bash
bunx wrangler deploy
```

Set `GROQ_API_KEY` / `GEMINI_API_KEY` as Worker secrets:

```bash
bunx wrangler secret put GROQ_API_KEY
```

## Privacy

Camera frames are sent to the configured vision provider only to generate a
description; guardian contacts, registered faces, and voice preferences are
stored **locally in the browser** (`localStorage`), not on a server.
