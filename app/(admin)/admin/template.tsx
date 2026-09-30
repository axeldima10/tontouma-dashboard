import { PageTransition } from "@/components/motion/Motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
