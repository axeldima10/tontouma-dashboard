import "server-only";
import type { ChatDone, ChatMessage, OrganizationCandidate } from "@/lib/api/contract";
import { ApiError } from "@/lib/api/errors";
import { formatXOF } from "@/lib/format";
import { store, uuid } from "./store";

/**
 * Assistant simulé (DATA_SOURCE=mock) : imite les endpoints publics du chatbot pour tester l'écran
 * « Tester l'assistant » sans backend. Les réponses sont composées à partir des démarches PUBLIÉES,
 * comme le ferait l'IA — jamais présentées comme de vraies réponses (libellé « Réponse simulée »).
 */

type Conversation = { id: string; organizationId: string; messages: ChatMessage[] };
const memory = globalThis as unknown as { __tontoumaConversations?: Map<string, Conversation> };
const conversations = () => (memory.__tontoumaConversations ??= new Map());

const STOP = new Set(["comment", "pour", "faire", "obtenir", "une", "des", "les", "est", "que", "quoi", "avec", "dans", "mon", "mes", "suis", "faut", "quel", "quelle"]);
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const words = (text: string) => fold(text).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

function candidates(): OrganizationCandidate[] {
  return store()
    .organizations.filter((o) => o.active)
    .slice(0, 4)
    .map(({ id, name, type, address }) => ({ id, name, type, address }));
}

export type MockStart = { id: string } | { status: "disambiguation_required"; candidates: OrganizationCandidate[] };

/** `POST /public/conversations` simulé. */
export function startConversation(input: { organizationId?: string; question?: string }): MockStart {
  const s = store();
  let organizationId = input.organizationId;
  if (organizationId) {
    const org = s.organizations.find((o) => o.id === organizationId && o.active);
    if (!org) throw new ApiError("notFound", "Organisation introuvable ou désactivée", 404);
  } else {
    if (!input.question?.trim()) throw new ApiError("validation", "Envoyez organizationId ou question.", 400);
    const asked = words(input.question);
    const matches = s.organizations.filter((o) => o.active && words(`${o.name} ${o.type ?? ""}`).some((w) => asked.includes(w)));
    if (matches.length !== 1) return { status: "disambiguation_required", candidates: matches.length > 1 ? matches.map(({ id, name, type, address }) => ({ id, name, type, address })) : candidates() };
    organizationId = matches[0].id;
  }
  const conversation = { id: uuid(), organizationId, messages: [] };
  conversations().set(conversation.id, conversation);
  return { id: conversation.id };
}

/** `POST /public/conversations/{id}/messages` simulé : renvoie le texte complet + l'événement `done`. */
export function answer(conversationId: string, question: string): { text: string; done: ChatDone } {
  const conversation = conversations().get(conversationId);
  if (!conversation) throw new ApiError("notFound", "Conversation inconnue", 404);
  const data = store().orgData[conversation.organizationId];
  const activeServices = new Set((data?.services ?? []).filter((s) => s.active).map((s) => s.id));
  const published = (data?.procedures ?? []).filter((p) => p.active && activeServices.has(p.serviceId));
  const asked = words(question);

  const scored = published
    .map((p) => ({ p, score: words(`${p.title} ${p.description ?? ""} ${p.serviceName ?? ""}`).filter((w) => asked.includes(w)).length }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0]?.score ? scored[0].p : null;

  let text: string;
  let confidence: number;
  if (best) {
    const conditions = (best.conditions ?? "").split(/\r?\n/).filter(Boolean);
    const documents = [...best.requiredDocuments].sort((a, b) => a.displayOrder - b.displayOrder).map((d) => d.label);
    text = [
      `Pour « ${best.title} » : ${best.cost === null ? "le coût n’est pas précisé" : best.cost === 0 ? "c’est gratuit" : `cela coûte ${formatXOF(best.cost)}`}` +
        (best.processingDays === null ? "." : `, avec un délai de ${best.processingDays} jour${best.processingDays > 1 ? "s" : ""}.`),
      best.place ? `Rendez-vous : ${best.place}.` : "",
      conditions.length ? `Conditions : ${conditions.join(" ; ")}.` : "",
      documents.length ? `À apporter : ${documents.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    confidence = Math.min(0.95, 0.55 + scored[0].score * 0.12);
  } else {
    text = published.length
      ? `Je n’ai pas trouvé de démarche publiée qui corresponde. Démarches disponibles : ${published.map((p) => p.title).join(", ")}.`
      : "Cette organisation n’a encore publié aucune démarche : je ne peux pas répondre pour l’instant.";
    confidence = 0.2;
  }

  const sources = (data?.documents ?? [])
    .filter((d) => d.active)
    .slice(0, best ? 2 : 0)
    .map((d, i) => ({ documentId: d.id, title: d.title, category: d.category, relevanceScore: Number((0.82 - i * 0.17).toFixed(2)) }));

  const now = new Date().toISOString();
  const messageId = uuid();
  conversation.messages.push(
    { id: uuid(), role: "USER", content: question, confidence: null, sources: [], audioUrl: null, createdAt: now },
    { id: messageId, role: "ASSISTANT", content: text, confidence, sources, audioUrl: null, createdAt: now },
  );
  return { text, done: { messageId, confidence, sources, audioUrl: null, qrCode: null, memoryReset: false } };
}

/** `GET /public/conversations/{id}/messages` simulé. */
export function history(conversationId: string): ChatMessage[] {
  const conversation = conversations().get(conversationId);
  if (!conversation) throw new ApiError("notFound", "Conversation inconnue", 404);
  return conversation.messages;
}
