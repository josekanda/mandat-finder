import Link from "next/link";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import Reveal from "@/components/motion/reveal";
import Parallax from "@/components/motion/parallax";
import ParallaxScale from "@/components/motion/parallax-scale";
import WordReveal from "@/components/motion/word-reveal";
import StepRail from "@/components/motion/step-rail";

const trustItems = ["Courtiers locaux", "Prospection ciblée", "Supabase sécurisé", "Pipeline exploitable"];

const signals = [
  "Année de construction",
  "Années de détention",
  "Adresse et zone ciblée",
  "Score de priorité",
];

const faqs = [
  {
    q: "À qui s’adresse Mandat Finder ?",
    a: "Aux agences de courtage qui veulent détecter plus vite les propriétés à potentiel et structurer leur prospection sans se perdre dans des fichiers bruts.",
  },
  {
    q: "Est-ce un CRM complet ?",
    a: "Non, l’objectif premier est d’identifier, comprendre et qualifier les opportunités avant ou au début du suivi commercial.",
  },
  {
    q: "Comment les propriétés sont-elles priorisées ?",
    a: "La plateforme combine plusieurs signaux : l’année de construction, la zone, l’ancienneté de détention et un score de priorité lisible.",
  },
  {
    q: "Peut-on commencer petit ?",
    a: "Oui, tu peux démarrer sur un seul code postal québécois, puis élargir le périmètre au fur et à mesure.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-neutral-50 text-neutral-950">
      <ScrollProgress />

      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-neutral-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Mandat Finder
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            <a href="#methode" className="hover:text-neutral-950">Méthode</a>
            <a href="#exemple" className="hover:text-neutral-950">Exemple</a>
            <a href="#faq" className="hover:text-neutral-950">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-white"
            >
              Se connecter
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Demander un accès
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24 lg:pt-20">
        <Reveal>
          <div>
            <div className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
              Prospection immobilière ciblée pour agences locales
            </div>

            <WordReveal
              as="h1"
              className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-neutral-950 sm:text-6xl"
            >
              Trouve les biens à potentiel avant qu’ils deviennent des mandats pour les autres.
            </WordReveal>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              Mandat Finder aide les agences à cibler les bonnes zones, comprendre les signaux utiles
              et transformer une base brute en opportunités concrètes à traiter.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Accéder à l’espace agence
              </Link>
              <a
                href="#exemple"
                className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Voir un exemple
              </a>
            </div>
          </div>
        </Reveal>

        <div className="relative">
          <Parallax offset={40}>
            <div className="pointer-events-none absolute -left-16 -top-16 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
          </Parallax>
          <Parallax offset={-28}>
            <div className="pointer-events-none absolute -right-8 bottom-0 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />
          </Parallax>

        <Parallax offset={18}>
          <ParallaxScale>
          <Reveal delay={0.08}>
            <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Vue synthèse</p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-950">Rosemont · H2S 1X3</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    Score 86
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-neutral-500">Construit en</p>
                    <p className="mt-2 text-xl font-semibold text-neutral-950">1958</p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-neutral-500">Statut</p>
                    <p className="mt-2 text-xl font-semibold text-neutral-950">Contact à lancer</p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-neutral-500">Zone</p>
                    <p className="mt-2 text-xl font-semibold text-neutral-950">Active</p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-neutral-500">Détention</p>
                    <p className="mt-2 text-xl font-semibold text-neutral-950">14 ans</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          </ParallaxScale>
        </Parallax>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 text-sm text-neutral-500 sm:grid-cols-4 sm:px-6 lg:px-8">
          {trustItems.map((item) => (
            <div key={item} className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center font-medium">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-neutral-500">Pourquoi ça change la donne</p>
            <WordReveal as="h2" className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              Une interface simple pour passer de la donnée brute à une action commerciale claire.
            </WordReveal>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Reveal>
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
              <p className="text-sm font-medium text-neutral-500">Bento grid</p>
              <h3 className="mt-2 text-2xl font-semibold text-neutral-950">
                Priorise les bons biens au lieu d’explorer des lignes sans contexte.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
                Les signaux sont regroupés dans une vue lisible : score, année de construction, zone, historique et statut pipeline.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.04}>
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-neutral-500">Vue carte</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                Repère les clusters rapidement.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-neutral-500">Pipeline</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                Découvert → contacté → RDV → mandat signé.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
              <p className="text-sm font-medium text-neutral-500">Utilisation réelle</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                Suffisamment simple pour être adopté par une agence, pas seulement admiré en démo.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-medium text-neutral-500">Signaux suivis</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
                  Quelques indices simples suffisent à faire émerger de vraies priorités.
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {signals.map((item, index) => (
                  <Reveal key={item} delay={index * 0.04}>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                      <p className="text-base font-medium text-neutral-900">{item}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <ParallaxScale>
          <Reveal>
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-neutral-500">Screenshot produit</p>
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="grid gap-3">
                  <div className="rounded-xl bg-white p-4 text-sm text-neutral-600">Dashboard avec KPIs</div>
                  <div className="rounded-xl bg-white p-4 text-sm text-neutral-600">Liste triable des prospects</div>
                  <div className="rounded-xl bg-white p-4 text-sm text-neutral-600">Carte avec pins colorés</div>
                </div>
              </div>
            </div>
          </Reveal>
          </ParallaxScale>

          <Reveal delay={0.06}>
            <div id="exemple" className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-neutral-500">Exemple Rosemont</p>
              <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                Un test local, concret et rapide à comprendre.
              </h2>
              <p className="mt-4 text-sm leading-6 text-neutral-600">
                L’agence de courtage active H2S, affiche les propriétés scorées, visualise les adresses
                sur la carte, puis traite les biens chauds en priorité. Le but n’est pas de tout prédire,
                mais d’aider l’équipe à mieux décider où appeler en premier.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="methode" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-sm font-medium text-neutral-500">Méthode</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              Une méthode simple en quatre temps.
            </h2>
          </Reveal>

          <StepRail />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              name: "Agence de courtage pilote",
              quote:
                "On comprend enfin pourquoi une adresse remonte et quoi faire ensuite. L’outil aide à prioriser sans compliquer le travail.",
            },
            {
              name: "Courtier responsable de la prospection",
              quote:
                "La carte et le statut pipeline rendent la base beaucoup plus actionnable qu’un simple export brut.",
            },
            {
              name: "Direction commerciale",
              quote:
                "Le gain, c’est la clarté: moins de dispersion, plus de focus sur les opportunités crédibles.",
            },
          ].map((item, index) => (
            <Reveal key={item.name} delay={index * 0.05}>
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-sm leading-6 text-neutral-600">“{item.quote}”</p>
                <p className="mt-4 text-sm font-medium text-neutral-900">{item.name}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-sm font-medium text-neutral-500">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
              Questions fréquentes
            </h2>
          </Reveal>

          <div className="mt-8 space-y-4">
            {faqs.map((item, index) => (
              <Reveal key={item.q} delay={index * 0.04}>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <h3 className="text-base font-semibold text-neutral-950">{item.q}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{item.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-[2rem] border border-neutral-200 bg-neutral-950 px-6 py-10 text-white shadow-sm sm:px-10">
            <p className="text-sm font-medium text-neutral-300">CTA final</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight">
              Commence avec un périmètre simple, puis transforme la prospection en système exploitable.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300">
              Lance une première zone, qualifie les meilleurs scores et fais avancer le pipeline sans repartir de zéro à chaque fois.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
              >
                Demander un accès
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                Voir l’espace agence
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}