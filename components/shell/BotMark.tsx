"use client";

import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP, MEDIA } from "@/lib/motion/gsap";

type BotMarkProps = {
  size?: number;
  /** Anime l'arrivée puis une légère lévitation (réservé aux en-têtes d'accueil). */
  alive?: boolean;
  className?: string;
};

export function BotMark({ size = 36, alive = false, className }: BotMarkProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!alive) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const tl = gsap.timeline();
        tl.from(ref.current, { scale: 0.4, rotation: -12, autoAlpha: 0, duration: 0.9, ease: "back.out(2)" })
          .from(".bot-halo", { scale: 0.6, autoAlpha: 0, duration: 0.8 }, "<0.2")
          .to(".bot-img", { y: -3, duration: 2.2, ease: "sine.inOut", repeat: -1, yoyo: true });
        gsap.to(".bot-halo", { scale: 1.25, autoAlpha: 0, duration: 2.6, ease: "power1.out", repeat: -1, delay: 1.2 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <span
      ref={ref}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-[28%] bg-soft-green ring-1 ring-green/20",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {alive && <span aria-hidden className="bot-halo absolute inset-0 rounded-[28%] ring-2 ring-green/40" />}
      <Image
        src="/brand/tontouma-bot.png"
        alt=""
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        className="bot-img relative object-contain"
        priority={alive}
      />
    </span>
  );
}
