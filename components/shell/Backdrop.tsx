/**
 * Arrière-plan fixe : lueurs douces (dégradés radiaux, sans filtre blur) + grain léger.
 * Le verre des éléments flottants prend ainsi de la profondeur. Masqué si « réduire la transparence ».
 */
export function Backdrop() {
  return (
    <div data-backdrop aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="backdrop-blob -top-[18%] -left-[10%] h-[70vh] w-[60vw]"
        style={{ background: "radial-gradient(closest-side, var(--blob-a), transparent)" }}
      />
      <div
        className="backdrop-blob top-[30%] -right-[15%] h-[80vh] w-[55vw]"
        style={{ background: "radial-gradient(closest-side, var(--blob-b), transparent)" }}
      />
      <div
        className="backdrop-blob -bottom-[25%] left-[20%] h-[60vh] w-[50vw]"
        style={{ background: "radial-gradient(closest-side, var(--blob-c), transparent)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
