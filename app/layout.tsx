import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { cookies } from "next/headers";
import { DevPersonaSwitcher } from "@/components/auth/DevPersonaSwitcher";
import { Backdrop } from "@/components/shell/Backdrop";
import { InlineScript } from "@/components/ui/InlineScript";
import { isDevAuth } from "@/lib/auth/mode";
import { PERSONA_COOKIE, toPersonaId } from "@/lib/auth/personas";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Tontouma Bot — Administration", template: "%s · Tontouma Bot" },
  description: "Publiez vos services et démarches : l’assistant Tontouma les explique aux citoyens.",
  icons: { icon: "/brand/tontouma-bot.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9f1ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0b171a" },
  ],
};

/** Les composants Clerk héritent des jetons de la charte (clair / sombre suivent automatiquement). */
const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "var(--primary)",
    colorPrimaryForeground: "var(--primary-foreground)",
    colorBackground: "var(--card)",
    colorForeground: "var(--foreground)",
    colorMutedForeground: "var(--muted-foreground)",
    colorMuted: "var(--muted)",
    colorInput: "var(--card)",
    colorInputForeground: "var(--foreground)",
    colorBorder: "var(--border-strong)",
    colorNeutral: "var(--foreground)",
    colorDanger: "var(--destructive)",
    colorRing: "var(--ring)",
    colorModalBackdrop: "color-mix(in srgb, var(--bg-3) 50%, transparent)",
    fontFamily: "var(--font-urbanist)",
    borderRadius: "0.9rem",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const devAuth = isDevAuth();
  const persona = devAuth ? toPersonaId((await cookies()).get(PERSONA_COOKIE)?.value) : null;

  return (
    <html lang="fr" suppressHydrationWarning className={`${urbanist.variable} h-full antialiased`}>
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body className="min-h-full">
        <Backdrop />
        {persona ? (
          <>
            {children}
            <DevPersonaSwitcher current={persona} />
          </>
        ) : (
          <ClerkProvider localization={frFR} appearance={clerkAppearance}>
            {children}
          </ClerkProvider>
        )}
      </body>
    </html>
  );
}
