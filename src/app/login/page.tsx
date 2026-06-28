import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <main
      className="min-h-screen text-[#F0F0F0]"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.07) 0%, transparent 70%), #0C0C0C" }}
    >
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">

        {/* Panneau gauche */}
        <section className="hidden border-r border-[#272727] lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div>
            {/* Logo mark */}
            <div className="flex items-center gap-3 mb-8">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-black"
                style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
              >
                IS
              </div>
              <span className="text-lg font-semibold tracking-tight text-[#F0F0F0]">
                Immosignaux
              </span>
            </div>

            <h2 className="text-3xl font-bold leading-tight text-[#F0F0F0]">
              Trouvez vos mandats.<br />
              <span style={{ color: "#C9A84C" }}>Avant tout le monde.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#777]">
              Détectez les propriétaires les plus susceptibles de vendre grâce aux données officielles du gouvernement du Québec.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#272727] bg-[#141414] p-5">
              <p className="text-sm font-semibold" style={{ color: "#C9A84C" }}>
                Ce que vous retrouvez après connexion
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#AAA]">
                <li>— Dashboard avec KPIs et top prospects scorés</li>
                <li>— Liste triable + carte géographique interactive</li>
                <li>— Fiche prospect avec pipeline de statuts</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#272727] bg-[#141414] p-5">
              <p className="text-sm font-semibold text-[#F0F0F0]">30 396 propriétés analysées</p>
              <p className="mt-2 text-sm text-[#777]">
                Montréal · Laval · Laurentides — mis à jour chaque trimestre via le MAMH.
              </p>
            </div>
          </div>
        </section>

        {/* Panneau droit — formulaire */}
        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-md rounded-3xl border border-[#272727] bg-[#141414] p-8 shadow-2xl">

            {/* Logo mobile */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black"
                style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
              >
                IS
              </div>
              <span className="text-base font-semibold text-[#F0F0F0]">Immosignaux</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#F0F0F0]">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-[#777]">
              Accédez à votre espace de prospection.
            </p>

            <div className="mt-8">
              <Suspense fallback={<div className="text-sm text-[#777]">Chargement…</div>}>
                <LoginForm />
              </Suspense>
            </div>

            <div className="mt-6 border-t border-[#272727] pt-5">
              <p className="text-xs text-[#555]">
                Espace réservé aux courtiers immobiliers partenaires Immosignaux.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
