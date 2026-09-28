import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
<<<<<<< HEAD
import { BotMark } from "@/components/shell/BotMark";
import { SignInStory } from "@/components/shell/SignInStory";
import { isDevAuth } from "@/lib/auth/mode";
=======
import { isDevAuth } from "@/lib/auth/mode";
import { Aurora } from "@/components/shell/Aurora";
import { BotMark } from "@/components/shell/BotMark";
import { SignInStory } from "@/components/shell/SignInStory";
>>>>>>> 939f032 (First Commit)

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  if (isDevAuth()) redirect("/dashboard");
  return (
<<<<<<< HEAD
    <div className="grid min-h-dvh lg:grid-cols-[1.15fr_1fr]">
=======
    <div className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <Aurora />
>>>>>>> 939f032 (First Commit)
      <SignInStory />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="flex items-center gap-3 lg:hidden">
          <BotMark size={44} alive />
<<<<<<< HEAD
          <p className="text-lg font-bold tracking-tight text-foreground">Tontouma Bot</p>
=======
          <p className="font-display text-lg font-bold text-text">Tontouma Bot</p>
>>>>>>> 939f032 (First Commit)
        </div>
        <SignIn />
      </main>
    </div>
  );
}
