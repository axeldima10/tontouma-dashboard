"use client";

import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert } from "lucide-react";
import { Toaster as Sonner } from "sonner";

/** Notifications en verre, en bas à droite (en haut sur mobile). */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      gap={10}
      offset={20}
      mobileOffset={12}
      visibleToasts={4}
      icons={{
        success: <CircleCheck className="size-[18px] text-brand-ink" />,
        error: <CircleAlert className="size-[18px] text-destructive" />,
        warning: <TriangleAlert className="size-[18px] text-warning" />,
        info: <Info className="size-[18px] text-info" />,
        loading: <Loader2 className="size-[18px] animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "glass-strong flex w-[min(380px,calc(100vw-24px))] items-start gap-3 rounded-[22px] px-4 py-3.5 font-sans text-foreground",
          title: "text-sm font-semibold leading-snug",
          description: "mt-0.5 text-[13px] leading-relaxed text-muted-foreground",
          icon: "mt-0.5",
          actionButton: "ml-auto shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground",
          closeButton: "text-muted-foreground",
        },
      }}
    />
  );
}
