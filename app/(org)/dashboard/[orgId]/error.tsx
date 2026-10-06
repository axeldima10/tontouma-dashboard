"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { RouteError } from "@/components/states/States";
import { reportError } from "@/lib/observability/report";

export default function SegmentError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { orgId } = useParams<{ orgId: string }>();
  useEffect(() => {
    reportError(error, { area: "org", orgId });
  }, [error, orgId]);
  return <RouteError retry={retry} />;
}
