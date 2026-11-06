import { permanentRedirect } from "next/navigation";

// « Ressources » s'appelle désormais « Ma boîte à outils ».
export default function ResourcesPage() {
  permanentRedirect("/app/boite-a-outils");
}
