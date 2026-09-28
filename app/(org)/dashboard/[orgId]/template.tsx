import { PageTransition } from "@/lib/motion/PageTransition";

export default function OrgTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
