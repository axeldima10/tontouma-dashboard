"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { RouteError } from "@/components/states/States";

export default function SegmentError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { area: "admin" } });
  }, [error]);
  return <RouteError retry={retry} />;
}
