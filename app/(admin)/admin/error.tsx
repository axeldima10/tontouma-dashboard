"use client";

import { useEffect } from "react";
import { RouteError } from "@/components/states/States";
import { reportError } from "@/lib/observability/report";

export default function SegmentError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    reportError(error, { area: "admin" });
  }, [error]);
  return <RouteError retry={retry} />;
}
