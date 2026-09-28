"use client";

import { RouteError } from "@/components/states/RouteError";

export default function OrgError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError retry={retry} />;
}
