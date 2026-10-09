import { MailX } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LazyClerkInvitationSignIn, LazyClerkSignUp } from "@/components/auth/LazyClerk";
import { BotMark } from "@/components/shell/BotMark";
import { SignInStory } from "@/components/shell/SignInStory";
import { StatePanel } from "@/components/states/States";
import { Button } from "@/components/ui/Button";
import { isDevAuth } from "@/lib/auth/mode";

export const metadata: Metadata = { title: "Rejoindre votre organisation" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Adresse de retour des invitations Clerk créées par le backend (`redirect_url`).
 * Clerk y ajoute `__clerk_ticket` et `__clerk_status` : `sign_up` (nouveau compte), `sign_in` (compte existant)
 * ou `complete` (déjà connecté). Les composants Clerk valident eux-mêmes le ticket.
 */
export default async function InvitationPage({ searchParams }: { searchParams: SearchParams }) {
  if (isDevAuth()) redirect("/dashboard");
  const params = await searchParams;
  const ticket = first(params.__clerk_ticket);
  const status = first(params.__clerk_status);
  if (status === "complete") redirect("/dashboard");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.15fr_1fr]">
      <SignInStory />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="flex items-center gap-3 lg:hidden">
          <BotMark size={44} alive />
          <p className="text-lg font-bold tracking-tight text-foreground">Tontouma Bot</p>
        </div>
        {!ticket ? (
          <StatePanel
            role="alert"
            tone="warning"
            icon={<MailX />}
            title="Lien d’invitation invalide ou expiré"
            description="Ouvrez le lien reçu par email, ou demandez une nouvelle invitation à l’administrateur de votre organisation."
            actions={<Button href="/sign-in">Se connecter</Button>}
          />
        ) : status === "sign_in" ? (
          <LazyClerkInvitationSignIn />
        ) : (
          <LazyClerkSignUp />
        )}
      </main>
    </div>
  );
}
