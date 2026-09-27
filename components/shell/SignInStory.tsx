"use client";

import { CheckCircle2, FileText, MessageCircle, MonitorSmartphone } from "lucide-react";
import { motion } from "motion/react";
import { BotMark } from "./BotMark";

const EASE = [0.16, 1, 0.3, 1] as const;

const FLOATING = [
  { Icon: CheckCircle2, title: "Extrait de naissance", hint: "Publié · 200 FCFA · 24 h", className: "top-[8%] right-[6%]", delay: 0.5 },
  { Icon: FileText, title: "Guide du citoyen 2026", hint: "Base de connaissances", className: "bottom-[30%] -left-[4%]", delay: 0.7 },
  { Icon: MonitorSmartphone, title: "Borne du hall", hint: "En service", className: "right-[2%] bottom-[8%]", delay: 0.9 },
];

/** Panneau d'accueil de la connexion : ce que fait Tontouma Bot, en cartes de verre flottantes. */
export function SignInStory() {
  return (
    <section className="relative hidden overflow-hidden p-6 lg:flex">
      <div className="glass relative flex w-full flex-col justify-between overflow-hidden rounded-[36px] p-10 xl:p-14">
        <div className="flex items-center gap-3">
          <BotMark size={48} alive />
          <div>
            <p className="text-lg font-bold tracking-tight text-foreground">Tontouma Bot</p>
            <p className="text-sm text-muted-foreground">Espace des organisations</p>
          </div>
        </div>

        <div className="relative my-10 min-h-[320px] flex-1">
          {FLOATING.map(({ Icon, title, hint, className, delay }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
              transition={{
                opacity: { duration: 0.8, delay, ease: EASE },
                scale: { duration: 0.8, delay, ease: EASE },
                y: { duration: 6, delay: delay + 0.8, repeat: Infinity, ease: "easeInOut" },
              }}
              className={`glass-strong absolute flex items-center gap-3 rounded-[22px] py-3 pr-5 pl-3 ${className}`}
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: EASE }}
            className="absolute top-1/2 left-1/2 w-[min(380px,80%)] -translate-x-1/2 -translate-y-1/2 space-y-3"
          >
            <p className="ml-auto w-fit rounded-[20px] rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              Comment obtenir un extrait de naissance ?
            </p>
            <div className="flex items-end gap-2">
              <BotMark size={30} />
              <p className="glass-strong rounded-[20px] rounded-bl-md px-4 py-3 text-sm leading-relaxed text-foreground">
                Présentez-vous au guichet 2 avec votre pièce d’identité. C’est <b>200 FCFA</b>, délivré en <b>24 h</b>.
              </p>
            </div>
          </motion.div>
        </div>

        <div>
          <h2 className="max-w-md text-[34px] leading-[1.1] font-light tracking-[-0.02em] text-foreground">
            Ce que vous publiez ici, l’assistant le répète aux citoyens.
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="size-4" aria-hidden /> Services, démarches, documents et bornes, au même endroit.
          </p>
        </div>
      </div>
    </section>
  );
}
