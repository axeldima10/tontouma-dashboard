export {};

declare global {
  /** Claims ajoutées au jeton de session Clerk (voir .env.example / README Clerk). */
  interface CustomJwtSessionClaims {
    platform_role?: string;
  }
}
