export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Mentions légales
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Dernière mise à jour : mai 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-neutral-700">
        <section>
          <h2 className="text-base font-semibold text-neutral-950">Éditeur du site</h2>
          <p className="mt-2">
            Mandat Finder est un outil de prospection immobilière édité à titre professionnel
            à l'intention des agences de courtage membres de l'OACIQ.
            Pour toute question, contactez-nous à :{" "}
            <a href="mailto:contact@mandat-finder.ca" className="underline">
              contact@mandat-finder.ca
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Hébergement</h2>
          <p className="mt-2">
            Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 701,
            San Francisco, CA 94104, États-Unis.
          </p>
          <p className="mt-1">
            La base de données est hébergée par <strong>Supabase</strong> sur infrastructure
            AWS (région Canada ou États-Unis selon disponibilité).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Propriété intellectuelle</h2>
          <p className="mt-2">
            L'ensemble du contenu de ce site (textes, interfaces, code) est la propriété exclusive
            de l'éditeur. Toute reproduction, même partielle, est interdite sans autorisation écrite
            préalable.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Données personnelles</h2>
          <p className="mt-2">
            Le traitement des renseignements personnels est décrit dans notre{" "}
            <a href="/legal/loi25" className="underline">
              politique de confidentialité (Loi 25)
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Témoins (cookies)</h2>
          <p className="mt-2">
            Ce site utilise uniquement des témoins techniques nécessaires à l'authentification.
            Aucun témoin publicitaire ou de traçage tiers n'est déposé.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Sources des données immobilières</h2>
          <p className="mt-2">
            Les données affichées proviennent de registres publics (rôle d'évaluation foncière
            municipale — MAMH, Registre des entreprises du Québec — REQ) et sont fournies à titre
            indicatif pour les courtiers membres de l'OACIQ. L'éditeur ne garantit pas leur
            exhaustivité ni leur exactitude absolue.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Limitation de responsabilité</h2>
          <p className="mt-2">
            L'utilisation des informations présentées relève de la responsabilité exclusive du
            courtier. Mandat Finder est un outil d'aide à la décision, non un service de conseil
            juridique ou financier.
          </p>
        </section>
      </div>
    </main>
  );
}
