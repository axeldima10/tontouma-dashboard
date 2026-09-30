import Image from "next/image";
import { cn } from "@/lib/cn";

type BotMarkProps = {
  size?: number;
  /** Légère lévitation + halo (réservé aux écrans d'accueil). */
  alive?: boolean;
  className?: string;
};

/** Marque Tontouma Bot dans une pastille de verre. */
export function BotMark({ size = 36, alive = false, className }: BotMarkProps) {
  return (
    <span
      className={cn("glass-strong relative grid shrink-0 place-items-center rounded-[30%]", className)}
      style={{ width: size, height: size }}
    >
      {alive && <span aria-hidden className="absolute inset-0 animate-ping rounded-[30%] ring-2 ring-brand/30 [animation-duration:2.8s]" />}
      <Image
        src="/brand/tontouma-bot.png"
        alt=""
        width={Math.round(size * 0.7)}
        height={Math.round(size * 0.7)}
        className={cn("relative object-contain", alive && "motion-safe:animate-[bob_3s_ease-in-out_infinite]")}
        priority={alive}
      />
    </span>
  );
}
