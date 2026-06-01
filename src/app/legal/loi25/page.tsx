export default function Loi25Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Politique de confidentialité — Loi 25
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Dernière mise à jour : mai 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-neutral-700">
        <section>
          <h2 className="text-base font-semibold text-neutral-950">1. Responsable du traitement</h2>
          <p className="mt-2">
            Mandat Finder est édité à titre professionnel par son propriétaire, conformément à la
            Loi modernisant des dispositions législatives en matière de protection des renseignements
            personnels (Loi 25). Pour toute question relative à vos renseignements personnels,
            contactez-nous à{" "}
            <a href="mailto:contact@mandat-finder.ca" className="underline">
              contact@mandat-finder.ca
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">2. Renseignements collectés</h2>
          <p className="mt-2">
            Nous collectons uniquement les renseignements nécessaires au fonctionnement du service :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Adresse courriel et informations de connexion (authentification)</li>
            <li>Données d'usage de l'application (pages visitées, actions effectuées)</li>
            <li>
              Données immobilières issues de registres publics (rôle d'évaluation foncière
              municipale — MAMH, Registre des entreprises du Québec — REQ) utilisées à des fins
              de prospection professionnelle
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">3. Fondement juridique</h2>
          <p className="mt-2">
            Le traitement repose sur l'intérêt légitime de l'éditeur (prospection immobilière
            professionnelle à partir de registres publics) et sur l'exécution du contrat de service
            pour les données de compte, conformément à la Loi 25.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">4. Conservation des renseignements</h2>
          <p className="mt-2">
            Les données de compte sont conservées pendant la durée d'activité du compte, puis
            supprimées dans un délai de 30 jours suivant la résiliation. Les données de prospection
            issues des registres publics sont mises à jour régulièrement et ne constituent pas des
            renseignements personnels au sens de la Loi 25.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">5. Vos droits</h2>
          <p className="mt-2">
            Conformément à la Loi 25, vous disposez d'un droit d'accès, de rectification et de
            suppression de vos renseignements personnels. Pour exercer ces droits, contactez-nous
            par courriel. Vous pouvez également adresser une plainte à la Commission d'accès à
            l'information du Québec (CAI) :{" "}
            <a href="https://www.cai.gouv.qc.ca" className="underline">
              www.cai.gouv.qc.ca
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">6. Sous-traitants</h2>
          <p className="mt-2">
            Nous utilisons Supabase pour le stockage des données et Vercel pour l'hébergement de
            l'application. Ces prestataires sont assujettis à des ententes de confidentialité
            compatibles avec nos obligations sous la Loi 25.
          </p>
        </section>
      </div>
    </main>
  );
}
