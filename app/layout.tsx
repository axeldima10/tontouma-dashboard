import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { cookies } from "next/headers";
import { DevPersonaSwitcher } from "@/components/auth/DevPersonaSwitcher";
import { isDevAuth } from "@/lib/auth/mode";
import { PERSONA_COOKIE, toPersonaId } from "@/lib/auth/personas";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Tontouma Bot — Administration", template: "%s · Tontouma Bot" },
  description: "Publiez vos services et démarches : l’assistant Tontouma les explique aux citoyens.",
  icons: { icon: "/brand/tontouma-bot.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#07110d" },
  ],
};

/** Les composants Clerk héritent des jetons de la charte (clair / sombre suivent automatiquement). */
const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
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
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const devAuth = isDevAuth();
  const persona = devAuth ? toPersonaId((await cookies()).get(PERSONA_COOKIE)?.value) : null;

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
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
