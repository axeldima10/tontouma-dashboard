import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { isDevAuth } from "@/lib/auth/mode";

/**
 * Le proxy ne fait qu'attacher l'état d'authentification Clerk à la requête.
 * Le contrôle d'accès se fait au niveau de la ressource (recommandation Clerk) :
 * - /dashboard : `requireSession` / `requireOrgContext` (lib/auth/guards.ts) dans les layouts et pages ;
 * - /admin : `app/(admin)/admin/layout.tsx` exige une session et la claim plateforme.
 * Le backend reste l'autorité : ces contrôles n'évitent que l'affichage d'écrans inutiles.
 */
const clerkProxy = clerkMiddleware();

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  return isDevAuth() ? NextResponse.next() : clerkProxy(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
