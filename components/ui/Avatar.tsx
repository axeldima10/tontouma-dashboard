import Image from "next/image";
import { cn } from "@/lib/cn";

/** Palette douce déterministe : la même personne garde la même couleur. */
const HUES = [152, 188, 204, 222, 262, 32, 342];

function hueOf(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return HUES[Math.abs(hash) % HUES.length];
}

export function initialsOf(name: string): string {
  const parts = name.replace(/[@.].*$/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

type AvatarProps = { name: string; imageUrl?: string | null; size?: number; className?: string; square?: boolean };

export function Avatar({ name, imageUrl, size = 36, className, square }: AvatarProps) {
  const radius = square ? "rounded-[30%]" : "rounded-full";
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={cn("shrink-0 object-cover ring-2 ring-white/70", radius, className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const hue = hueOf(name);
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center font-semibold ring-2 ring-white/60 dark:ring-white/10", radius, className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(145deg, hsl(${hue} 55% 88%), hsl(${hue} 45% 76%))`,
        color: `hsl(${hue} 55% 22%)`,
      }}
    >
      {initialsOf(name)}
    </span>
  );
}
