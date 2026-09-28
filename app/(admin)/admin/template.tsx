import { PageTransition } from "@/lib/motion/PageTransition";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
