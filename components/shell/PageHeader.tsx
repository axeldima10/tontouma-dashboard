<<<<<<< HEAD
"use client";

import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  badges?: ReactNode;
  className?: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;

/** En-tête de page : grand titre léger (typographie de la référence), description et actions. */
export function PageHeader({ kicker, title, description, actions, back, badges, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0 max-w-3xl">
        {back && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <Link
              href={back.href}
              className="group mb-3 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
              {back.label}
            </Link>
          </motion.div>
        )}
        {kicker && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="kicker mb-2">
            {kicker}
          </motion.p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-[28px] leading-[1.1] font-light tracking-[-0.02em] text-foreground sm:text-[36px]"
          >
            {title}
          </motion.h1>
          {badges && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-2">
              {badges}
            </motion.div>
          )}
        </div>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            className="mt-2 text-[15px] leading-relaxed text-muted-foreground"
          >
            {description}
          </motion.p>
        )}
      </div>
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
          className="flex flex-wrap items-center gap-2"
        >
          {actions}
        </motion.div>
      )}
=======
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  kicker?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, kicker, actions }: PageHeaderProps) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="font-display text-[26px] leading-tight font-semibold text-text sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
>>>>>>> 939f032 (First Commit)
    </header>
  );
}
