<<<<<<< HEAD
import { PageTransition } from "@/components/motion/Motion";

export default function Template({ children }: { children: React.ReactNode }) {
=======
import { PageTransition } from "@/lib/motion/PageTransition";

export default function OrgTemplate({ children }: { children: React.ReactNode }) {
>>>>>>> 939f032 (First Commit)
  return <PageTransition>{children}</PageTransition>;
}
