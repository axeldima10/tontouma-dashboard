"use client";

<<<<<<< HEAD
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
=======
import { FileCheck2, Mic, Send } from "lucide-react";
import { useRef } from "react";
import { gsap, useGSAP, EASE, MEDIA } from "@/lib/motion/gsap";
import { SplitHeading } from "@/lib/motion/SplitHeading";
import { BotMark } from "./BotMark";

const EXCHANGE = [
  { from: "citoyen", text: "Quels documents pour un extrait de naissance ?" },
  { from: "bot", text: "Une pièce d’identité et le numéro de registre. Coût : 200 FCFA, délai : 48 h. Guichet 3, premier couloir à droite." },
];

const PROMISES = [
  { Icon: FileCheck2, text: "Vous publiez services et démarches, sans jargon technique." },
  { Icon: Mic, text: "L’assistant les explique aux citoyens, à l’écrit comme à l’oral." },
  { Icon: Send, text: "Rien n’est visible avant votre publication explicite." },
];

/** Panneau d'accueil : montre en une scène ce que l'administration va rendre possible. */
export function SignInStory() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out }, delay: 0.6 });
        tl.from(".story-bubble", { y: 20, autoAlpha: 0, scale: 0.96, duration: 0.8, stagger: 0.9 })
          .from(".story-promise", { x: -16, autoAlpha: 0, duration: 0.7, stagger: 0.12 }, "-=0.4");
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <aside ref={ref} className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex xl:p-16">
      <div className="flex items-center gap-3">
        <BotMark size={48} alive />
        <div>
          <p className="font-display text-lg font-bold tracking-tight text-text">Tontouma Bot</p>
          <p className="kicker !text-[10px]">Espace administration</p>
        </div>
      </div>

      <div className="max-w-xl">
        <p className="kicker">Service public augmenté</p>
        <SplitHeading className="font-display mt-4 text-[44px] leading-[1.05] font-semibold text-text text-balance xl:text-[52px]">
          Votre savoir administratif, prêt à répondre à chaque citoyen.
        </SplitHeading>

        <div className="glass mt-10 space-y-3 rounded-3xl p-5">
          {EXCHANGE.map((line) =>
            line.from === "citoyen" ? (
              <p key={line.text} className="story-bubble ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-green px-4 py-2.5 text-sm text-on-green">
                {line.text}
              </p>
            ) : (
              <div key={line.text} className="story-bubble flex items-end gap-2">
                <BotMark size={28} />
                <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-panel px-4 py-2.5 text-sm text-text">
                  {line.text}
                </p>
              </div>
            ),
          )}
        </div>
      </div>

      <ul className="space-y-3">
        {PROMISES.map(({ Icon, text }) => (
          <li key={text} className="story-promise flex items-center gap-3 text-sm text-muted">
            <span className="grid size-8 place-items-center rounded-[10px] bg-soft-green text-green-ink">
              <Icon className="size-4" aria-hidden />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </aside>
>>>>>>> 939f032 (First Commit)
  );
}
