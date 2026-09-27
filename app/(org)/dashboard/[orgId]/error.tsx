"use client";

import { RouteError } from "@/components/states/States";

export default function SegmentError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError retry={retry} />;
}
