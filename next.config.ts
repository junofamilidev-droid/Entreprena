import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // La plateforme apprenant a quitté la racine pour /app (la vitrine occupe désormais « / »).
  // Redirections temporaires (307) au départ ; à passer en permanentes une fois tout vérifié.
  async redirects() {
    const moved = ["compte", "connexion", "mot-de-passe-oublie", "avis", "aide", "certificat", "projets", "ressources", "boite-a-outils", "demo-atelier", "demo-session"];
    return [
      { source: "/catalogue", destination: "/formations", permanent: false },
      // Modules, étapes et sessions : la page de vente garde /formations/[slug], le reste part sous /app.
      { source: "/formations/:slug/:rest+", destination: "/app/formations/:slug/:rest+", permanent: false },
      ...moved.map((p) => ({ source: `/${p}`, destination: `/app/${p}`, permanent: false })),
    ];
  },
  partialPrefetching: true,
  // Les fichiers de contenu (content/) sont lus à l'exécution : on les embarque dans le déploiement.
  outputFileTracingIncludes: { "/**": ["./content/**/*.json"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
