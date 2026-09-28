/** Session vue par l'interface, quelle que soit la source (Clerk ou persona de développement). */
export type Session = {
  mode: "clerk" | "dev";
  userId: string;
  name: string;
  firstName: string | null;
  email: string | null;
  imageUrl: string | null;
  orgId: string | null;
  /** Renseigné en mode dev ; en mode Clerk, l'interface lit l'organisation via les hooks Clerk. */
  orgName: string | null;
  orgRole: string | null;
  isPlatformAdmin: boolean;
  /** Persona actif (mode dev uniquement). */
  personaId: string | null;
};
