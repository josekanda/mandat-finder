import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="hidden border-r border-neutral-200 bg-white lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Mandat Finder
            </Link>
            <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600">
              Détecte les biens à potentiel, priorise les signaux utiles et transforme la prospection
              terrain en pipeline exploitable.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-sm font-medium text-neutral-900">Ce que tu retrouves après connexion</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>- Dashboard avec KPIs et top prospects.</li>
                <li>- Liste triable + carte des opportunités.</li>
                <li>- Fiche prospect avec statut pipeline.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-sm font-medium text-neutral-900">Exemple d’usage</p>
              <p className="mt-2 text-sm text-neutral-600">
                Une agence cible Villeurbanne, identifie les biens énergivores, priorise les scores élevés,
                puis suit les contacts jusqu’au mandat signé.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">
                ← Retour à l’accueil
              </Link>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">
                Connexion
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Reçois un lien magique par email pour accéder à ton espace agence.
              </p>
            </div>

            <Suspense fallback={<div className="text-sm text-neutral-500">Chargement du formulaire…</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}