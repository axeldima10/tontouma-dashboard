"use client";

import { useMemo } from "react";
import { z } from "zod";
import { useDemoMode } from "@/components/shell/DemoMode";
import { demoHistory, demoSearchOrganizations, demoSendMessage, demoStartConversation } from "@/lib/actions/assistant";
import type { ActionResult } from "@/lib/actions/result";
import {
  chatMessageSchema,
  organizationCandidateSchema,
  pageSchema,
  sourceRefSchema,
  startConversationSchema,
  type ChatDone,
  type ChatMessage,
  type OrganizationCandidate,
} from "./contract";
import { ApiError } from "./errors";
import { normalizeBaseUrl, request, toResponseError } from "./request";

/**
 * Client des endpoints PUBLICS du chatbot (`/api/v1/public/...`), appelés depuis le navigateur sans jeton,
 * exactement comme la borne ou la PWA. En démonstration (DATA_SOURCE=mock), les mêmes opérations passent
 * par l'assistant simulé.
 */

export type StreamHandlers = {
  onDelta: (text: string) => void;
  onAudio: (chunk: { audioUrl: string; index: number; total: number }) => void;
  onLanguageAlert: (alert: { declaredLanguage: string | null; detectedLanguage: string | null }) => void;
  /** Panne IA en cours de flux : le flux se termine normalement (HTTP 200). */
  onError: (message: string) => void;
  onDone: (done: ChatDone) => void;
};

export type StartResult = { kind: "started"; id: string } | { kind: "disambiguation"; candidates: OrganizationCandidate[] };

const PUBLIC = "/api/v1/public";

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new ApiError(result.error.kind, result.error.message, null, result.error.violations);
  return result.data;
}

const doneSchema = z.object({
  messageId: z.string().nullish(),
  confidence: z.number().nullish(),
  sources: z.array(sourceRefSchema).nullish(),
  audioUrl: z.string().nullish(),
  qrCode: z.string().nullish(),
  memoryReset: z.boolean().nullish(),
});

function toDone(value: unknown): ChatDone {
  const parsed = doneSchema.safeParse(value);
  const d = parsed.success ? parsed.data : {};
  return {
    messageId: d.messageId ?? null,
    confidence: d.confidence ?? null,
    sources: d.sources ?? [],
    audioUrl: d.audioUrl ?? null,
    qrCode: d.qrCode ?? null,
    memoryReset: d.memoryReset ?? false,
  };
}

/** Lit un flux `text/event-stream` (événements séparés par une ligne vide). */
async function readSse(response: Response, handlers: StreamHandlers) {
  if (!response.body) throw new ApiError("server", "Flux de réponse vide");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  const dispatch = (block: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
    if (data.length === 0) return;
    const raw = data.join("\n");
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      payload = { delta: raw };
    }
    switch (event) {
      case "message":
        handlers.onDelta(typeof payload.delta === "string" ? payload.delta : "");
        break;
      case "audio-chunk":
        if (typeof payload.audioUrl === "string")
          handlers.onAudio({ audioUrl: payload.audioUrl, index: Number(payload.index ?? 0), total: Number(payload.total ?? 0) });
        break;
      case "language-alert":
        handlers.onLanguageAlert({
          declaredLanguage: typeof payload.declaredLanguage === "string" ? payload.declaredLanguage : null,
          detectedLanguage: typeof payload.detectedLanguage === "string" ? payload.detectedLanguage : null,
        });
        break;
      case "error":
        handlers.onError(typeof payload.message === "string" ? payload.message : "Le service IA a échoué.");
        break;
      case "done":
        handlers.onDone(toDone(payload));
        break;
    }
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    blocks.forEach(dispatch);
  }
  if (buffer.trim()) dispatch(buffer);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useAssistantClient() {
  const demo = useDemoMode();

  return useMemo(() => {
    const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    const base = () => {
      if (!baseUrl) throw new ApiError("network", "NEXT_PUBLIC_API_BASE_URL manquante : le navigateur ne sait pas où joindre l’assistant.");
      return baseUrl;
    };

    /** Rend jouable une URL audio renvoyée par le backend (absolue, chemin, ou simple nom de fichier). */
    const resolveAudio = (url: string) => {
      if (/^(https?:|blob:|data:)/.test(url)) return url;
      if (url.startsWith("/")) return `${baseUrl ?? ""}${url}`;
      return `${baseUrl ?? ""}${PUBLIC}/conversations/audio/${encodeURIComponent(url)}`;
    };

    async function start(input: { organizationId?: string; question?: string }): Promise<StartResult> {
      const body = demo
        ? unwrap(await demoStartConversation(input))
        : await request(base(), `${PUBLIC}/conversations`, null, { method: "POST", body: { ...input, language: "fr" }, schema: startConversationSchema });
      if ("id" in body && body.id) return { kind: "started", id: body.id };
      const candidates = "candidates" in body && body.candidates ? body.candidates : [];
      return { kind: "disambiguation", candidates };
    }

    async function ask(conversationId: string, content: string, tts: boolean, handlers: StreamHandlers, signal?: AbortSignal) {
      if (demo) {
        const { text, done } = unwrap(await demoSendMessage(conversationId, content));
        // Écriture progressive pour reproduire le rendu du flux SSE réel.
        for (const word of text.split(/(\s+)/)) {
          if (signal?.aborted) return;
          handlers.onDelta(word);
          await wait(word.trim() ? 28 : 0);
        }
        handlers.onDone(done);
        return;
      }
      let response: Response;
      try {
        response = await fetch(`${base()}${PUBLIC}/conversations/${encodeURIComponent(conversationId)}/messages`, {
          method: "POST",
          headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
          body: JSON.stringify({ content, tts }),
          signal,
        });
      } catch (error) {
        if (signal?.aborted) return;
        throw new ApiError("network", error instanceof Error ? error.message : "Réseau indisponible");
      }
      if (!response.ok) throw await toResponseError(response);
      await readSse(response, handlers);
    }

    async function askVoice(conversationId: string, audio: Blob, lang: "wo" | "fr", tts: boolean, handlers: StreamHandlers, signal?: AbortSignal) {
      if (demo) {
        handlers.onError("La question vocale est transcrite par le service IA : elle nécessite le vrai backend.");
        return;
      }
      const form = new FormData();
      const extension = audio.type.includes("mp4") ? "m4a" : audio.type.includes("mpeg") ? "mp3" : audio.type.includes("wav") ? "wav" : "webm";
      form.set("file", audio, `question.${extension}`);
      const params = new URLSearchParams({ lang, tts: String(tts) });
      let response: Response;
      try {
        response = await fetch(`${base()}${PUBLIC}/conversations/${encodeURIComponent(conversationId)}/messages/audio?${params}`, {
          method: "POST",
          headers: { Accept: "text/event-stream" },
          body: form,
          signal,
        });
      } catch (error) {
        if (signal?.aborted) return;
        throw new ApiError("network", error instanceof Error ? error.message : "Réseau indisponible");
      }
      if (!response.ok) throw await toResponseError(response);
      await readSse(response, handlers);
    }

    async function history(conversationId: string): Promise<ChatMessage[]> {
      if (demo) return unwrap(await demoHistory(conversationId));
      return request(base(), `${PUBLIC}/conversations/${encodeURIComponent(conversationId)}/messages`, null, { schema: z.array(chatMessageSchema) });
    }

    async function searchOrganizations(q: string): Promise<OrganizationCandidate[]> {
      if (demo) return unwrap(await demoSearchOrganizations(q));
      const params = new URLSearchParams({ q, size: "20" });
      const page = await request(base(), `${PUBLIC}/organizations?${params}`, null, { schema: pageSchema(organizationCandidateSchema) });
      return page.content;
    }

    return { demo, start, ask, askVoice, history, searchOrganizations, resolveAudio };
  }, [demo]);
}
