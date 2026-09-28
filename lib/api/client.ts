"use client";

import { useCallback } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { ApiError } from "./errors";
import { request, type RequestOptions } from "./request";

/** Appel backend depuis un composant client : le jeton est demandé juste avant chaque requête. */
export function useApi() {
  const { session, getToken } = useSession();

  return useCallback(
    async <T,>(path: string, options?: RequestOptions<T>): Promise<T> => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) throw new ApiError("contractPending", "NEXT_PUBLIC_API_BASE_URL non configurée");
      const token = await getToken();
      if (!token && session.mode === "clerk") throw new ApiError("unauthorized", "Aucune session active", 401);
      return request(baseUrl, path, token, options);
    },
    [getToken, session.mode],
  );
}
