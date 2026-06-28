import Link from "next/link";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import Reveal from "@/components/motion/reveal";
import Parallax from "@/components/motion/parallax";
import ParallaxScale from "@/components/motion/parallax-scale";
import WordReveal from "@/components/motion/word-reveal";
import StepRail from "@/components/motion/step-rail";

const trustItems = ["Courtiers locaux", "Prospection ciblée", "Données MAMH", "Pipeline exploitable"];

const signals = [
  "Année de construction",
  "Années de détention",
  "Adresse et zone ciblée",
  "Score de priorité",
];

const faqs = [
  {
    q: "À qui s'adresse Immosignaux ?",
    a: "Aux agences de courtage qui veulent détecter plus vite les propriétés à potentiel et structurer leur prospection sans se perdre dans des fichiers bruts.",
  },
  {
    q: "Est-ce un CRM complet ?",
    a: "Non, l'objectif premier est d'identifier, comprendre et qualifier les opportunités avant ou au début du suivi commercial.",
  },
  {
    q: "Comment les propriétés sont-elles priorisées ?",
    a: "La plateforme combine plusieurs signaux : l'année de construction, la zone, l'ancienneté de détention et un score de priorité lisible.",
  },
  {
    q: "Peut-on commencer petit ?",
    a: "Oui, tu peux démarrer sur un seul code postal québécois, puis élargir le périmètre au fur et à mesure.",
  },
];

export default function HomePage() {
  return (
    <main
      className="min-h-screen text-[#F0F0F0]"
      style={{ background: "#0C0C0C" }}
    >
      <ScrollProgress />

      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-[#272727]"
        style={{ background: "rgba(12,12,12,0.92)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black"
              style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
            >
              IS
            </div>
            <span className="text-base font-semibold tracking-tight text-[#F0F0F0]">
              Immosignaux
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[#777] md:flex">
            <a href="#methode" className="hover:text-[#C9A84C] transition-colors">Méthode</a>
            <a href="#exemple" className="hover:text-[#C9A84C] transition-colors">Exemple</a>
            <a href="#faq" className="hover:text-[#C9A84C] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-[#272727] px-4 py-2 text-sm font-medium text-[#AAA] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
            >
              Demander un accès
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24 lg:pt-20"
        style={{ background: "radial-gradient(ellipse 70% 50% at 30% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)" }}
      >
        <Reveal>
          <div>
            <div className="inline-flex rounded-full border border-[#272727] bg-[#141414] px-3 py-1 text-xs font-medium text-[#C9A84C]">
              Prospection immobilière ciblée pour agences locales
            </div>

            <WordReveal
              as="h1"
              className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-[#F0F0F0] sm:text-6xl"
            >
              Trouve les biens à potentiel avant qu'ils deviennent des mandats pour les autres.
            </WordReveal>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#777]">
              Immosignaux aide les agences à cibler les bonnes zones, comprendre les signaux utiles
              et transformer une base brute en opportunités concrètes à traiter.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
              >
                Accéder à l'espace agence
              </Link>
              <a
                href="#exemple"
                className="rounded-xl border border-[#272727] bg-[#141414] px-5 py-3 text-sm font-medium text-[#AAA] hover:border-[#C9A84C] transition-colors"
              >
                Voir un exemple
              </a>
            </div>
          </div>
        </Reveal>

        <div className="relative">
          <Parallax offset={40}>
            <div className="pointer-events-none absolute -left-16 -top-16 h-80 w-80 rounded-full blur-3xl" style={{ background: "rgba(201,168,76,0.07)" }} />
          </Parallax>
          <Parallax offset={-28}>
            <div className="pointer-events-none absolute -right-8 bottom-0 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(201,168,76,0.04)" }} />
          </Parallax>

          <Parallax offset={18}>
            <ParallaxScale>
              <Reveal delay={0.08}>
                <div className="rounded-3xl border border-[#272727] bg-[#141414] p-4 shadow-2xl sm:p-6">
                  <div className="rounded-2xl border border-[#272727] bg-[#1C1C1C] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#777]">Vue synthèse</p>
                        <p className="mt-1 text-2xl font-semibold text-[#F0F0F0]">Rosemont · H2S 1X3</p>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-black" style={{ background: "#C9A84C" }}>
                        Score 86
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Construit en", value: "1958" },
                        { label: "Statut", value: "Contact à lancer" },
                        { label: "Zone", value: "Active" },
                        { label: "Détention", value: "16 ans" },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl border border-[#272727] bg-[#141414] p-4">
                          <p className="text-xs text-[#555]">{label}</p>
                          <p className="mt-2 text-lg font-semibold text-[#F0F0F0]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            </ParallaxScale>
          </Parallax>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-[#272727] bg-[#0E0E0E]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 text-sm sm:grid-cols-4 sm:px-6 lg:px-8">
          {trustItems.map((item) => (
            <div key={item} className="rounded-xl border border-[#272727] bg-[#141414] px-4 py-3 text-center text-sm font-medium text-[#AAA]">
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Value prop grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Pourquoi ça change la donne</p>
            <WordReveal as="h2" className="mt-2 text-3xl font-semibold tracking-tight text-[#F0F0F0]">
              Une interface simple pour passer de la donnée brute à une action commerciale claire.
            </WordReveal>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Reveal>
            <div className="rounded-3xl border border-[#272727] bg-[#141414] p-6 shadow-sm lg:col-span-2">
              <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Vue prospects</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#F0F0F0]">
                Priorise les bons biens au lieu d'explorer des lignes sans contexte.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#777]">
                Les signaux sont regroupés dans une vue lisible : score, année de construction, zone, historique et statut pipeline.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.04}>
            <div className="rounded-3xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
              <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Vue carte</p>
              <p className="mt-2 text-lg font-semibold text-[#F0F0F0]">
                Repère les clusters rapidement.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-3xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
              <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Pipeline</p>
              <p className="mt-2 text-lg font-semibold text-[#F0F0F0]">
                Découvert → contacté → RDV → mandat signé.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="rounded-3xl border border-[#272727] bg-[#141414] p-6 shadow-sm lg:col-span-2">
              <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Utilisation réelle</p>
              <p className="mt-2 text-lg font-semibold text-[#F0F0F0]">
                Suffisamment simple pour être adopté par une agence, pas seulement admiré en démo.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Signals section */}
      <section className="border-y border-[#272727] bg-[#0E0E0E]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Signaux suivis</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#F0F0F0]">
                  Quelques indices simples suffisent à faire émerger de vraies priorités.
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {signals.map((item, index) => (
                  <Reveal key={item} delay={index * 0.04}>
                    <div className="rounded-2xl border border-[#272727] bg-[#141414] p-5">
                      <p className="text-base font-medium text-[#F0F0F0]">{item}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Example section */}
      <section id="exemple" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <ParallaxScale>
            <Reveal>
              <div className="rounded-3xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
                <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Aperçu produit</p>
                <div className="mt-4 rounded-2xl border border-[#272727] bg-[#1C1C1C] p-4">
                  <div className="grid gap-3">
                    {["Dashboard avec KPIs et top prospects", "Liste triable des prospects scorés", "Carte avec pins colorés par score"].map((label) => (
                      <div key={label} className="rounded-xl border border-[#272727] bg-[#141414] p-4 text-sm text-[#AAA]">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </ParallaxScale>

          <Reveal delay={0.06}>
            <div className="rounded-3xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
              <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Exemple Rosemont</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#F0F0F0]">
                Un test local, concret et rapide à comprendre.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#777]">
                L'agence de courtage active H2S, affiche les propriétés scorées, visualise les adresses
                sur la carte, puis traite les biens chauds en priorité. Le but n'est pas de tout prédire,
                mais d'aider l'équipe à mieux décider où appeler en premier.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Method section */}
      <section id="methode" className="border-y border-[#272727] bg-[#0E0E0E]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Méthode</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#F0F0F0]">
              Une méthode simple en quatre temps.
            </h2>
          </Reveal>

          <StepRail />
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              name: "Agence de courtage pilote",
              quote: "On comprend enfin pourquoi une adresse remonte et quoi faire ensuite. L'outil aide à prioriser sans compliquer le travail.",
            },
            {
              name: "Courtier responsable de la prospection",
              quote: "La carte et le statut pipeline rendent la base beaucoup plus actionnable qu'un simple export brut.",
            },
            {
              name: "Direction commerciale",
              quote: "Le gain, c'est la clarté : moins de dispersion, plus de focus sur les opportunités crédibles.",
            },
          ].map((item, index) => (
            <Reveal key={item.name} delay={index * 0.05}>
              <div className="rounded-3xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
                <p className="text-sm leading-6 text-[#777]">"{item.quote}"</p>
                <p className="mt-4 text-sm font-medium text-[#C9A84C]">{item.name}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-y border-[#272727] bg-[#0E0E0E]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#F0F0F0]">
              Questions fréquentes
            </h2>
          </Reveal>

          <div className="mt-8 space-y-4">
            {faqs.map((item, index) => (
              <Reveal key={item.q} delay={index * 0.04}>
                <div className="rounded-2xl border border-[#272727] bg-[#141414] p-5">
                  <h3 className="text-base font-semibold text-[#F0F0F0]">{item.q}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#777]">{item.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div
            className="rounded-[2rem] border border-[#272727] px-6 py-10 sm:px-10"
            style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%), #141414" }}
          >
            <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>Commencer</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-[#F0F0F0]">
              Commence avec un périmètre simple, puis transforme la prospection en système exploitable.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#777]">
              Lance une première zone, qualifie les meilleurs scores et fais avancer le pipeline sans repartir de zéro à chaque fois.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                style={{ background: "#C9A84C" }}
              >
                Demander un accès
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-[#272727] bg-[#1C1C1C] px-5 py-3 text-sm font-medium text-[#AAA] hover:border-[#C9A84C] transition-colors"
              >
                Voir l'espace agence
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
