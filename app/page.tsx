import { redirect } from "next/navigation";

/** La page marketing est une tâche séparée : la racine mène au tableau de bord. */
export default function Home() {
  redirect("/dashboard");
}
