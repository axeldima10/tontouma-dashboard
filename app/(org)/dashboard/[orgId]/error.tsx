"use client";

import * as Sentry from "@sentry/nextjs";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { RouteError } from "@/components/states/States";

export default function SegmentError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { orgId } = useParams<{ orgId: string }>();
  useEffect(() => {
    Sentry.captureException(error, { tags: { area: "org", orgId } });
  }, [error, orgId]);
  return <RouteError retry={retry} />;
}
