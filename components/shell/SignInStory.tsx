"use client";

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
  );
}
