export {};

declare global {
  /** Claims ajoutées au jeton de session Clerk (voir .env.example / README Clerk). */
  interface CustomJwtSessionClaims {
    platform_role?: string;
    /** Identité affichée (optionnelle) : évite un appel à l'API Clerk à chaque page. */
    first_name?: string | null;
    full_name?: string | null;
    email?: string | null;
    image_url?: string | null;
  }
}
