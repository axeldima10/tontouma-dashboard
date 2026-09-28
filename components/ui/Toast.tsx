"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, use, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, EASE, MEDIA } from "@/lib/motion/gsap";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; tone: ToastTone; title: string; description?: string };
type ToastApi = { show: (toast: Omit<ToastItem, "id">) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = use(ToastContext);
  if (!context) throw new Error("useToast doit être utilisé dans <ToastProvider>");
  return context;
}

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;
const ICON_TONES = { success: "text-green-ink", error: "text-danger", info: "text-info" } as const;
const DURATION_MS = 5200;

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const Icon = ICONS[toast.tone];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.from(ref.current, { y: 24, scale: 0.94, autoAlpha: 0, duration: 0.55, ease: EASE.pop });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const dismiss = () => {
    const reduce = window.matchMedia(MEDIA.reduce).matches;
    if (reduce || !ref.current) return onDismiss(toast.id);
    gsap.to(ref.current, {
      x: 40,
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => onDismiss(toast.id),
    });
  };

  const onTimeout = useEffectEvent(dismiss);
  useEffect(() => {
    const timer = window.setTimeout(onTimeout, DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <li
      ref={ref}
      role={toast.tone === "error" ? "alert" : "status"}
      className="glass pointer-events-auto flex w-full items-start gap-3 rounded-2xl p-4"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", ICON_TONES[toast.tone])} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-[13px] text-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer la notification"
        className="-m-1 grid size-7 place-items-center rounded-full text-muted hover:bg-surface-3 hover:text-text"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((toast: Omit<ToastItem, "id">) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={api}>
      {children}
      <ol
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </ol>
    </ToastContext>
  );
}
