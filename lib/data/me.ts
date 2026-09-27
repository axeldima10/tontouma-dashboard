import "server-only";
import { cache } from "react";
import type { Me } from "@/lib/api/contract";
import { settle, type Settled } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/types";
import { repo } from "./repository";

/** `GET /me` pour la session courante (mémorisé par requête). */
export const loadMe = cache(async (session: Session): Promise<Settled<Me>> => {
  return settle(
    repo().then((r) =>
      r.getMe({
        userId: session.userId,
        email: session.email,
        firstName: session.firstName,
        name: session.name,
        orgKey: session.orgId,
        isPlatformAdmin: session.isPlatformAdmin,
      }),
    ),
  );
});
