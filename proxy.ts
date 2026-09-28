import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { isDevAuth } from "@/lib/auth/mode";
import { PERSONA_COOKIE, PERSONAS, toPersonaId } from "@/lib/auth/personas";
import { isPlatformAdminClaims } from "@/lib/auth/roles";

const isOrgDashboard = createRouteMatcher(["/dashboard(.*)"]);
const isPlatformAdmin = createRouteMatcher(["/admin(.*)"]);

function forbidden(req: NextRequest) {
  return NextResponse.rewrite(new URL("/acces-refuse", req.url), { status: 403 });
}

/**
 * Protection côté serveur (jamais uniquement côté client) :
 * - /dashboard et /admin exigent une session ;
 * - /admin exige la claim `platform_role: "admin"`.
 * Le backend reste l'autorité : ceci n'évite que l'affichage d'écrans inutiles.
 */
const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (isOrgDashboard(req) || isPlatformAdmin(req)) await auth.protect();

  if (isPlatformAdmin(req)) {
    const { sessionClaims } = await auth();
    if (!isPlatformAdminClaims(sessionClaims)) return forbidden(req);
  }
});

/** Mode dev : mêmes règles d'accès, avec le persona fictif à la place de la session Clerk. */
function devProxy(req: NextRequest) {
  if (isPlatformAdmin(req)) {
    const persona = PERSONAS[toPersonaId(req.cookies.get(PERSONA_COOKIE)?.value)];
    if (!persona.isPlatformAdmin) return forbidden(req);
  }
  return NextResponse.next();
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  return isDevAuth() ? devProxy(req) : clerkProxy(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
