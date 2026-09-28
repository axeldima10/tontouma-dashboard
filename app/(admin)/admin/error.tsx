"use client";

<<<<<<< HEAD
import { RouteError } from "@/components/states/States";

export default function SegmentError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
=======
import { RouteError } from "@/components/states/RouteError";

export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
>>>>>>> 939f032 (First Commit)
  return <RouteError retry={retry} />;
}
