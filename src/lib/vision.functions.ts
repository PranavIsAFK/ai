import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  imageDataUrl: z.string().min(20),
  knownPeople: z
    .array(z.object({ name: z.string(), relation: z.string().optional(), photoDataUrl: z.string() }))
    .optional()
    .default([]),
});

function buildSystemPrompt(knownPeople: z.infer<typeof Input>["knownPeople"]) {
  const peopleNote = knownPeople.length
    ? `\n\nKnown people the user has registered (only mention by name if you're confident a visible person matches): ${knownPeople
        .map((p) => `${p.name}${p.relation ? ` (${p.relation})` : ""}`)
        .join(", ")}.`
    : "";

  return `You are VisionAI, narrating the world for a visually impaired user.
Reply in ONE or TWO short sentences (max 30 words). Plain language, present tense.
Prioritize in this order: immediate hazards (vehicles, stairs, obstacles, traffic lights), people and their position, then helpful context (doors, signs, room type).
Use direction words: "ahead", "to your left", "to your right", "close", "a few steps away".
Never invent details. If unsure, say what you can see briefly.${peopleNote}`;
}

function parseImageDataUrl(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid image data.");
  const header = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  return { mimeType, base64 };
}

async function describeWithGemini(apiKey: string, system: string, imageDataUrl: string) {
  const { mimeType, base64 } = parseImageDataUrl(imageDataUrl);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        {
          parts: [
            { text: "Describe what's in front of me right now." },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limited. Please wait a moment.");
    if (res.status === 403) throw new Error("Invalid Gemini API key.");
    throw new Error(`Gemini error ${res.status}: ${text.slice(0, 150)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
}

// Groq — free tier with vision, no credit card needed.
// Get a free key at console.groq.com → API Keys
async function describeWithGroq(apiKey: string, system: string, imageDataUrl: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: "Describe what's in front of me right now." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limited. Please wait a moment.");
    if (res.status === 401) throw new Error("Invalid Groq API key.");
    throw new Error(`Groq error ${res.status}: ${text.slice(0, 150)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

export const describeScene = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const cfEnv = (globalThis as unknown as { __CF_ENV?: Record<string, string> }).__CF_ENV ?? {};
    const geminiKey = cfEnv.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
    const groqKey = cfEnv.GROQ_API_KEY ?? process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      throw new Error(
        "No API key configured. Add GROQ_API_KEY (free at console.groq.com) or GEMINI_API_KEY to .env.local",
      );
    }

    const system = buildSystemPrompt(data.knownPeople);

    if (groqKey) {
      return { text: await describeWithGroq(groqKey, system, data.imageDataUrl) };
    }

    return { text: await describeWithGemini(geminiKey!, system, data.imageDataUrl) };
  });
