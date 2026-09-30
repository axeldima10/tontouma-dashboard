import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LazyClerkSignIn } from "@/components/auth/LazyClerk";
import { BotMark } from "@/components/shell/BotMark";
import { SignInStory } from "@/components/shell/SignInStory";
import { isDevAuth } from "@/lib/auth/mode";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  if (isDevAuth()) redirect("/dashboard");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.15fr_1fr]">
      <SignInStory />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="flex items-center gap-3 lg:hidden">
          <BotMark size={44} alive />
          <p className="text-lg font-bold tracking-tight text-foreground">Tontouma Bot</p>
        </div>
        <LazyClerkSignIn />
      </main>
    </div>
  );
}
