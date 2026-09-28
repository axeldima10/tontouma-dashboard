import type { Metadata, Viewport } from "next";
<<<<<<< HEAD
import { Urbanist } from "next/font/google";
=======
import { Inter, Space_Grotesk } from "next/font/google";
>>>>>>> 939f032 (First Commit)
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { cookies } from "next/headers";
import { DevPersonaSwitcher } from "@/components/auth/DevPersonaSwitcher";
<<<<<<< HEAD
import { Backdrop } from "@/components/shell/Backdrop";
=======
>>>>>>> 939f032 (First Commit)
import { isDevAuth } from "@/lib/auth/mode";
import { PERSONA_COOKIE, toPersonaId } from "@/lib/auth/personas";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

<<<<<<< HEAD
const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"], display: "swap" });
=======
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });
>>>>>>> 939f032 (First Commit)

export const metadata: Metadata = {
  title: { default: "Tontouma Bot — Administration", template: "%s · Tontouma Bot" },
  description: "Publiez vos services et démarches : l’assistant Tontouma les explique aux citoyens.",
  icons: { icon: "/brand/tontouma-bot.png" },
};

export const viewport: Viewport = {
  themeColor: [
<<<<<<< HEAD
    { media: "(prefers-color-scheme: light)", color: "#e9f1ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0b171a" },
=======
    { media: "(prefers-color-scheme: light)", color: "#f4f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#07110d" },
>>>>>>> 939f032 (First Commit)
  ],
};

/** Les composants Clerk héritent des jetons de la charte (clair / sombre suivent automatiquement). */
const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
<<<<<<< HEAD
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
=======
    colorPrimary: "var(--green)",
    colorPrimaryForeground: "var(--on-green)",
    colorBackground: "var(--panel)",
    colorForeground: "var(--text)",
    colorMutedForeground: "var(--muted)",
    colorMuted: "var(--surface-3)",
    colorInput: "var(--surface-2)",
    colorInputForeground: "var(--text)",
    colorBorder: "var(--line-strong)",
    colorNeutral: "var(--text)",
    colorDanger: "var(--danger)",
    colorRing: "var(--ring)",
    colorModalBackdrop: "color-mix(in srgb, var(--bg) 60%, transparent)",
    fontFamily: "var(--font-inter)",
    borderRadius: "0.75rem",
>>>>>>> 939f032 (First Commit)
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const devAuth = isDevAuth();
  const persona = devAuth ? toPersonaId((await cookies()).get(PERSONA_COOKIE)?.value) : null;

  return (
<<<<<<< HEAD
    <html lang="fr" suppressHydrationWarning className={`${urbanist.variable} h-full antialiased`}>
=======
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
>>>>>>> 939f032 (First Commit)
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
<<<<<<< HEAD
        <Backdrop />
=======
>>>>>>> 939f032 (First Commit)
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
