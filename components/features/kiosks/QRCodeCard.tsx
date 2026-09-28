"use client";

import { Download, Trash2 } from "lucide-react";
import QRCodeLib from "qrcode";
import { useEffect, useState } from "react";
import { Switch } from "@/components/forms/Fields";
import { IconButton } from "@/components/ui/Bits";
import { cn } from "@/lib/cn";
import type { QRCode } from "@/lib/data/types";

const COLORS = { dark: "#0f2a1c", light: "#ffffff" };

function download(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
}

type QRCodeCardProps = {
  qr: QRCode;
  targetLabel: string;
  readOnly: boolean;
  onToggle: (actif: boolean) => void;
  onDelete: () => void;
};

/** QR code rendu côté navigateur à partir de l'URL fournie par le backend ; export PNG et SVG pour l'impression. */
export function QRCodeCard({ qr, targetLabel, readOnly, onToggle, onDelete }: QRCodeCardProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCodeLib.toString(qr.url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: COLORS }).then((markup) => {
      if (!cancelled) setSvg(markup);
    });
    return () => {
      cancelled = true;
    };
  }, [qr.url]);

  const filename = `tontouma-qr-${qr.code.toLowerCase()}`;

  return (
    <article className={cn("surface flex flex-col p-4 transition-opacity", !qr.actif && "opacity-70")}>
      <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-line">
        {svg ? (
          // eslint-disable-next-line @next/next/no-img-element -- QR généré localement (data URL)
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt={`QR code vers ${targetLabel}`} className="size-full" />
        ) : (
          <span className="skeleton block size-full" />
        )}
        {!qr.actif && (
          <span className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-semibold text-muted">Désactivé</span>
        )}
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-text">{targetLabel}</p>
      <p className="truncate text-xs text-muted">{qr.url}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Switch checked={qr.actif} onChange={onToggle} label={qr.actif ? "Actif" : "Inactif"} disabled={readOnly} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!svg}
            onClick={async () => download(await QRCodeLib.toDataURL(qr.url, { width: 1024, margin: 2, color: COLORS }), `${filename}.png`)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-line px-2 text-xs font-medium text-text hover:border-green/40"
          >
            <Download className="size-3.5" aria-hidden /> PNG
          </button>
          <button
            type="button"
            disabled={!svg}
            onClick={() => svg && download(URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), `${filename}.svg`)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-line px-2 text-xs font-medium text-text hover:border-green/40"
          >
            <Download className="size-3.5" aria-hidden /> SVG
          </button>
          {!readOnly && (
            <IconButton label={`Supprimer le QR code ${qr.code}`} tone="danger" onClick={onDelete}>
              <Trash2 />
            </IconButton>
          )}
        </div>
      </div>
    </article>
  );
}
