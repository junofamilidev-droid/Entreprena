import { redirect } from "next/navigation";

// La page d'accueil publique (promesse, catalogue, méthode) viendra ici.
// D'ici là, l'adresse du site mène à l'espace de l'apprenant.
export default function Home() {
  redirect("/app");
}
