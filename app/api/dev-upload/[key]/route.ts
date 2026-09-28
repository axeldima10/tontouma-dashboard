import { NextResponse, type NextRequest } from "next/server";

/**
 * Cible des « URL pré-signées » du backend fictif (développement uniquement).
 * En réel, le navigateur envoie le fichier directement au stockage objet via l'URL du backend :
 * les octets ne transitent jamais par Next. Route à supprimer avec lib/data/mock.
 */
function unavailable() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.API_BASE_URL);
}

export async function PUT(request: NextRequest, context: RouteContext<"/api/dev-upload/[key]">) {
  if (unavailable()) return new NextResponse(null, { status: 404 });
  const { key } = await context.params;
  const { db } = await import("@/lib/data/mock/store");
  const pending = db().pendingUploads.get(key);
  if (!pending) return NextResponse.json({ message: "URL de téléversement inconnue ou expirée" }, { status: 404 });
  const data = new Uint8Array(await request.arrayBuffer());
  db().uploads.set(key, { contentType: request.headers.get("content-type") ?? pending.contentType, data });
  return new NextResponse(null, { status: 200 });
}

export async function GET(_request: NextRequest, context: RouteContext<"/api/dev-upload/[key]">) {
  if (unavailable()) return new NextResponse(null, { status: 404 });
  const { key } = await context.params;
  const { db } = await import("@/lib/data/mock/store");
  const upload = db().uploads.get(key);
  if (!upload) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(upload.data), {
    headers: { "Content-Type": upload.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
