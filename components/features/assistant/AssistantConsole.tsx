"use client";

import {
  AlertTriangle,
  Building2,
  Copy,
  FileText,
  History,
  Languages,
  Loader2,
  Mic,
  QrCode,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shell/PageHeader";
import { BotMark } from "@/components/shell/BotMark";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { SearchField } from "@/components/ui/Table";
import { Segmented } from "@/components/ui/Tabs";
import { Switch } from "@/components/ui/Switch";
import { useAssistantClient, type StreamHandlers } from "@/lib/api/assistant";
import type { ChatDone, ChatMessage, OrganizationCandidate } from "@/lib/api/contract";
import { describeError, toApiError } from "@/lib/api/errors";
import { cn } from "@/lib/cn";

type ConsoleMode = { kind: "org"; organizationId: string | null; organizationName: string } | { kind: "platform" };

type Turn = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  voice?: { seconds: number };
  streaming?: boolean;
  done?: ChatDone;
  error?: string;
  alert?: string;
  audioChunks?: number;
};

const SAMPLES = ["Comment obtenir un extrait de naissance ?", "Combien coûte un permis de construire ?", "Quels documents pour publier les bans ?", "Quels sont vos horaires ?"];

let turnSeq = 0;
const turnId = () => `turn-${++turnSeq}`;

/** File de lecture des morceaux audio (`audio-chunk`) : joués dans l'ordre, l'un après l'autre. */
function useAudioQueue(enabled: boolean) {
  const queue = useRef<string[]>([]);
  const playing = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const next = useCallback(() => {
    const playNext = () => {
      const url = queue.current.shift();
      if (!url) {
        playing.current = null;
        setSpeaking(false);
        return;
      }
      const audio = new Audio(url);
      playing.current = audio;
      setSpeaking(true);
      audio.onended = playNext;
      audio.onerror = playNext;
      void audio.play().catch(playNext);
    };
    playNext();
  }, []);

  const push = useCallback(
    (url: string) => {
      if (!enabled) return;
      queue.current.push(url);
      if (!playing.current) next();
    },
    [enabled, next],
  );

  const stop = useCallback(() => {
    queue.current = [];
    playing.current?.pause();
    playing.current = null;
    setSpeaking(false);
  }, []);

  return { push, stop, speaking };
}

/**
 * Console de test de l'assistant, via les endpoints publics du chatbot (comme une borne ou la PWA).
 * Outil interne : ce n'est pas l'application citoyenne.
 */
export function AssistantConsole({ mode }: { mode: ConsoleMode }) {
  const client = useAssistantClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState(mode.kind === "org" ? mode.organizationName : null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tts, setTts] = useState(false);
  const [lang, setLang] = useState<"wo" | "fr">("fr");
  const [candidates, setCandidates] = useState<{ question: string; list: OrganizationCandidate[] } | null>(null);
  /** `started` : horodatage `performance.now()` de l'événement `start` du MediaRecorder. */
  const [recording, setRecording] = useState<{ started: number; seconds: number } | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const audio = useAudioQueue(tts);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setRecording((r) => r && { ...r, seconds: Math.floor((performance.now() - r.started) / 1000) }), 250);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => () => abort.current?.abort(), []);

  const patch = (id: string, change: Partial<Turn> | ((turn: Turn) => Partial<Turn>)) =>
    setTurns((all) => all.map((t) => (t.id === id ? { ...t, ...(typeof change === "function" ? change(t) : change) } : t)));

  const handlersFor = (id: string): StreamHandlers => ({
    onDelta: (text) => patch(id, (t) => ({ content: t.content + text })),
    onAudio: (chunk) => {
      patch(id, (t) => ({ audioChunks: (t.audioChunks ?? 0) + 1 }));
      audio.push(client.resolveAudio(chunk.audioUrl));
    },
    onLanguageAlert: (a) =>
      patch(id, { alert: `Langue détectée « ${a.detectedLanguage ?? "?"} » différente de la langue choisie « ${a.declaredLanguage ?? "?"} ». Changez la langue vocale si la transcription est mauvaise.` }),
    onError: (message) => patch(id, { error: message, streaming: false }),
    onDone: (done) => {
      patch(id, { done, streaming: false });
      if (done.audioUrl && tts && !audio.speaking) audio.push(client.resolveAudio(done.audioUrl));
      if (done.memoryReset) setTurns((all) => [...all, { id: turnId(), role: "system", content: "La mémoire de la conversation a été réinitialisée par l’assistant." }]);
    },
  });

  /** Garantit une conversation ouverte ; renvoie son id, ou null si l'organisation doit être choisie. */
  const ensureConversation = async (question: string, organizationId?: string): Promise<string | null> => {
    if (conversationId && !organizationId) return conversationId;
    const result = await client.start(
      organizationId ? { organizationId } : mode.kind === "org" ? { organizationId: mode.organizationId ?? undefined } : { question },
    );
    if (result.kind === "disambiguation") {
      setCandidates({ question, list: result.candidates });
      return null;
    }
    setConversationId(result.id);
    setCandidates(null);
    return result.id;
  };

  const run = async (question: string, send: (id: string, handlers: StreamHandlers, signal: AbortSignal) => Promise<void>, userTurn: Turn, organizationId?: string) => {
    setBusy(true);
    audio.stop();
    setTurns((all) => [...all, userTurn]);
    const assistantId = turnId();
    try {
      const id = await ensureConversation(question, organizationId);
      if (!id) return;
      setTurns((all) => [...all, { id: assistantId, role: "assistant", content: "", streaming: true }]);
      abort.current = new AbortController();
      await send(id, handlersFor(assistantId), abort.current.signal);
      patch(assistantId, (t) => (t.streaming ? { streaming: false } : {}));
    } catch (error) {
      const apiError = toApiError(error);
      const description = describeError(apiError);
      setTurns((all) =>
        all.some((t) => t.id === assistantId)
          ? all.map((t) => (t.id === assistantId ? { ...t, streaming: false, error: `${description.title} : ${apiError.message}` } : t))
          : [...all, { id: assistantId, role: "assistant", content: "", error: `${description.title} : ${apiError.message}` }],
      );
    } finally {
      setBusy(false);
    }
  };

  const ask = (question: string, organizationId?: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setInput("");
    void run(text, (id, handlers, signal) => client.ask(id, text, tts, handlers, signal), { id: turnId(), role: "user", content: text }, organizationId);
  };

  const pickOrganization = (candidate: OrganizationCandidate) => {
    if (!candidates) return;
    const question = candidates.question;
    setOrganizationName(candidate.name);
    setCandidates(null);
    setTurns((all) => all.slice(0, -1)); // la question sera renvoyée dans la bonne conversation
    ask(question, candidate.id);
  };

  const toggleRecording = async () => {
    if (recording && recorder.current) {
      recorder.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Micro indisponible", { description: "Ce navigateur ne permet pas l’enregistrement (HTTPS requis hors localhost)." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      recorder.current = media;
      let started = 0;
      media.onstart = (event) => {
        started = event.timeStamp;
        setRecording({ started, seconds: 0 });
      };
      media.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      media.onstop = (event) => {
        stream.getTracks().forEach((t) => t.stop());
        const seconds = Math.max(1, Math.round((event.timeStamp - started) / 1000));
        setRecording(null);
        const blob = new Blob(chunks, { type: media.mimeType || "audio/webm" });
        const label = `Question vocale (${lang === "wo" ? "wolof" : "français"})`;
        void run(label, (id, handlers, signal) => client.askVoice(id, blob, lang, tts, handlers, signal), { id: turnId(), role: "user", content: label, voice: { seconds } });
      };
      media.start();
    } catch {
      toast.error("Micro refusé", { description: "Autorisez l’accès au micro dans le navigateur pour poser une question vocale." });
    }
  };

  const reset = () => {
    abort.current?.abort();
    audio.stop();
    setConversationId(null);
    setTurns([]);
    setCandidates(null);
    if (mode.kind === "platform") setOrganizationName(null);
  };

  const reloadHistory = async () => {
    if (!conversationId) return;
    try {
      const messages = await client.history(conversationId);
      setTurns(messages.map(fromHistory));
      toast.success("Historique rechargé depuis le serveur", { description: `${messages.length} message${messages.length > 1 ? "s" : ""}.` });
    } catch (error) {
      const e = toApiError(error);
      toast.error(describeError(e).title, { description: e.message });
    }
  };

  const unavailable = mode.kind === "org" && !mode.organizationId;

  return (
    <>
      <PageHeader
        kicker="Pilotage"
        title="Tester l’assistant"
        description={
          mode.kind === "org"
            ? "Posez les questions d’un citoyen : l’assistant répond uniquement avec le contenu publié de votre organisation."
            : "Mode PWA : l’organisation est déduite de la question, comme pour un citoyen sans structure choisie."
        }
        badges={client.demo && <StatusPill tone="warning">Réponses simulées</StatusPill>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        {/* Conversation */}
        <section className="glass flex h-[min(720px,calc(100dvh-13rem))] min-h-[520px] flex-col overflow-hidden rounded-[30px]">
          <header className="flex items-center gap-3 border-b border-[var(--glass-border)] px-5 py-4">
            <BotMark size={40} alive={busy || audio.speaking} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">Tontouma Bot{organizationName && ` · ${organizationName}`}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", busy ? "animate-pulse bg-[#f5a122]" : "bg-brand")} />
                {busy ? "En train de répondre…" : audio.speaking ? "Lecture de la réponse vocale…" : conversationId ? "Conversation ouverte" : "Prêt"}
              </p>
            </div>
            {audio.speaking && (
              <Button variant="secondary" size="sm" icon={<VolumeX />} onClick={audio.stop}>
                Couper
              </Button>
            )}
          </header>

          <div ref={scroller} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
            {turns.length === 0 && !candidates && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <BotMark size={64} alive />
                <p className="mt-5 text-lg font-light tracking-tight text-foreground">Que voulez-vous demander ?</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Écrivez une question, ou posez-la à voix haute avec le micro.</p>
                <div className="mt-6 flex max-w-lg flex-wrap justify-center gap-2">
                  {SAMPLES.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      disabled={unavailable}
                      onClick={() => ask(sample)}
                      className="rounded-full bg-card px-3.5 py-2 text-[13px] text-foreground shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {turns.map((turn) => (
                <motion.div key={turn.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <TurnView turn={turn} />
                </motion.div>
              ))}
            </AnimatePresence>

            {candidates && (
              <Disambiguation
                candidates={candidates.list}
                onPick={pickOrganization}
                search={client.searchOrganizations}
              />
            )}
          </div>

          {/* Saisie */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="border-t border-[var(--glass-border)] p-3 sm:p-4"
          >
            {unavailable && (
              <p className="mb-3 flex items-start gap-2 rounded-2xl bg-warning-soft px-3.5 py-2.5 text-xs text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Identifiant backend de l’organisation inconnu (GET /me indisponible). Vérifiez « Mon compte ».
              </p>
            )}
            <div className="flex items-end gap-2 rounded-[24px] bg-card p-2 shadow-[var(--card-shadow)]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                rows={1}
                disabled={busy || unavailable || recording !== null}
                placeholder={recording ? "Enregistrement en cours…" : "Posez une question (Entrée pour envoyer)"}
                aria-label="Question"
                className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-subtle"
              />
              <button
                type="button"
                onClick={toggleRecording}
                disabled={(busy && !recording) || unavailable}
                aria-label={recording ? "Arrêter et envoyer" : "Question vocale"}
                className={cn(
                  "relative grid size-10 shrink-0 place-items-center rounded-full transition disabled:opacity-40",
                  recording ? "bg-destructive text-white" : "bg-accent text-foreground hover:bg-border",
                )}
              >
                {recording && <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />}
                {recording ? <Square className="relative size-4" /> : <Mic className="size-[18px]" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || busy || unavailable}
                aria-label="Envoyer"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:-translate-y-px disabled:opacity-40"
              >
                {busy ? <Loader2 className="size-[18px] animate-spin" /> : <SendHorizontal className="size-[18px]" />}
              </button>
            </div>
            {recording && <p className="mt-2 text-center text-xs font-medium text-destructive tabular">● Enregistrement {recording.seconds} s — cliquez sur ■ pour envoyer</p>}
          </form>
        </section>

        {/* Réglages */}
        <aside className="space-y-4">
          <section className="glass rounded-[26px] p-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Réglages du test</h2>
            <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-card/70 px-4 py-3 shadow-[var(--card-shadow)]">
              <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                {tts ? <Volume2 className="size-4" /> : <VolumeX className="size-4 text-muted-foreground" />} Réponse vocale
              </span>
              <Switch checked={tts} onCheckedChange={setTts} aria-label="Réponse vocale" />
            </label>
            <div className="mt-3 rounded-2xl bg-card/70 px-4 py-3 shadow-[var(--card-shadow)]">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Languages className="size-4" /> Langue des questions vocales
              </p>
              <Segmented
                aria-label="Langue des questions vocales"
                value={lang}
                onValueChange={setLang}
                options={[
                  { value: "wo", label: "Wolof" },
                  { value: "fr", label: "Français" },
                ]}
              />
              <p className="mt-2 text-xs text-muted-foreground">Le service IA ne devine pas la langue d’un audio : choisissez celle parlée.</p>
            </div>
          </section>

          <section className="glass rounded-[26px] p-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Conversation</h2>
            {conversationId ? (
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(conversationId).then(() => toast.success("Identifiant copié"))}
                className="mt-3 flex w-full items-center gap-2 rounded-2xl bg-card/70 px-3.5 py-2.5 text-left shadow-[var(--card-shadow)]"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{conversationId}</span>
                <Copy className="size-3.5 shrink-0 text-subtle" aria-hidden />
              </button>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Ouverte à la première question.</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" icon={<History />} disabled={!conversationId || busy} onClick={reloadHistory}>
                Historique
              </Button>
              <Button variant="secondary" size="sm" icon={<RotateCcw />} disabled={busy || turns.length === 0} onClick={reset}>
                Nouvelle
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function fromHistory(message: ChatMessage): Turn {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    done:
      message.role === "ASSISTANT"
        ? { messageId: message.id, confidence: message.confidence, sources: message.sources, audioUrl: message.audioUrl, qrCode: null, memoryReset: false }
        : undefined,
  };
}

function TurnView({ turn }: { turn: Turn }) {
  if (turn.role === "system") {
    return <p className="mx-auto w-fit rounded-full bg-accent px-3 py-1 text-center text-xs text-muted-foreground">{turn.content}</p>;
  }
  if (turn.role === "user") {
    return (
      <div className="ml-auto w-fit max-w-[85%] rounded-[22px] rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {turn.voice ? (
          <span className="flex items-center gap-2">
            <Mic className="size-4" aria-hidden /> {turn.content} · {turn.voice.seconds} s
          </span>
        ) : (
          turn.content
        )}
      </div>
    );
  }
  const done = turn.done;
  return (
    <div className="flex items-end gap-2">
      <BotMark size={28} />
      <div className="max-w-[88%] space-y-2">
        <div className="rounded-[22px] rounded-bl-md bg-card px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground shadow-[var(--card-shadow)]">
          {turn.content}
          {turn.streaming && (
            <span className="ml-0.5 inline-flex gap-0.5 align-middle" aria-label="Réponse en cours">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-1.5 rounded-full bg-muted-foreground" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </span>
          )}
          {!turn.content && !turn.streaming && !turn.error && <span className="text-muted-foreground italic">Réponse vide.</span>}
        </div>

        {turn.alert && (
          <p className="flex items-start gap-2 rounded-2xl bg-warning-soft px-3 py-2 text-xs text-warning">
            <Languages className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {turn.alert}
          </p>
        )}
        {turn.error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-destructive-soft px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {turn.error}
          </p>
        )}

        {done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-1.5">
            {done.confidence !== null && (
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-[11px] text-muted-foreground shadow-[var(--card-shadow)]">
                <Sparkles className="size-3 text-brand-ink" aria-hidden /> Confiance
                <span className="h-1 w-10 overflow-hidden rounded-full bg-foreground/10">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round(Math.max(0, Math.min(1, done.confidence)) * 100)}%` }} />
                </span>
                <b className="tabular font-semibold text-foreground">{Math.round(done.confidence * 100)} %</b>
              </span>
            )}
            {done.sources.map((source, i) => (
              <span key={`${source.documentId}-${i}`} className="flex max-w-60 items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-1 text-[11px] text-info" title={source.relevanceScore !== null ? `Pertinence ${source.relevanceScore}` : undefined}>
                <FileText className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{source.title ?? "Document"}</span>
              </span>
            ))}
            {(turn.audioChunks ?? 0) > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px] text-muted-foreground shadow-[var(--card-shadow)]">
                <Volume2 className="size-3" aria-hidden /> {turn.audioChunks} extrait{(turn.audioChunks ?? 0) > 1 ? "s" : ""} audio
              </span>
            )}
          </motion.div>
        )}
        {done?.qrCode && <QrCodeCard value={done.qrCode} />}
      </div>
    </div>
  );
}

/** Le format de `qrCode` n'est pas précisé par le contrat : image si c'en est une, sinon lien ou texte. */
function QrCodeCard({ value }: { value: string }) {
  const isImage = value.startsWith("data:image") || /\.(png|svg|jpe?g)(\?|$)/i.test(value);
  const isLink = /^https?:\/\//.test(value);
  return (
    <div className="flex w-fit items-center gap-3 rounded-2xl bg-card p-3 shadow-[var(--card-shadow)]">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="QR code de la réponse" className="size-24 rounded-lg" />
      ) : (
        <span className="grid size-10 place-items-center rounded-xl bg-accent">
          <QrCode className="size-5" aria-hidden />
        </span>
      )}
      {!isImage && (isLink ? <a href={value} target="_blank" rel="noreferrer" className="max-w-56 truncate text-xs text-brand-ink underline">{value}</a> : <span className="max-w-56 truncate font-mono text-xs text-muted-foreground">{value}</span>)}
    </div>
  );
}

function Disambiguation({ candidates, onPick, search }: { candidates: OrganizationCandidate[]; onPick: (c: OrganizationCandidate) => void; search: (q: string) => Promise<OrganizationCandidate[]> }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrganizationCandidate[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      setSearching(true);
      search(query.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const list = query.trim().length >= 2 ? (results ?? []) : candidates;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
      <BotMark size={28} />
      <div className="w-full max-w-md space-y-3 rounded-[22px] rounded-bl-md bg-card p-4 shadow-[var(--card-shadow)]">
        <p className="text-sm text-foreground">{candidates.length > 0 ? "Plusieurs structures peuvent répondre. Laquelle ?" : "Je n’ai pas reconnu la structure. Cherchez-la :"}</p>
        <SearchField value={query} onChange={setQuery} placeholder="Autre structure… (2 lettres min.)" />
        {searching && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Recherche…
          </p>
        )}
        <ul className="space-y-1.5">
          {list.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c)} className="flex w-full items-center gap-3 rounded-2xl border border-border px-3 py-2.5 text-left transition hover:border-brand hover:bg-brand-soft">
                <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{[c.type, c.address].filter(Boolean).join(" · ")}</span>
                </span>
              </button>
            </li>
          ))}
          {query.trim().length >= 2 && !searching && results?.length === 0 && <li className="text-xs text-muted-foreground">Aucune structure active ne correspond.</li>}
        </ul>
      </div>
    </motion.div>
  );
}
