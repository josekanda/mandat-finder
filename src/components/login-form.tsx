"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();

    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message || "Impossible d’envoyer le lien de connexion.");
      return;
    }

    setStatus("success");
    setMessage("Un lien de connexion a été envoyé à votre adresse email.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-neutral-700">
          Adresse email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="vous@agence.fr"
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-950"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Envoi en cours..." : "Recevoir un lien de connexion"}
      </button>

      {message ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <p className="text-xs leading-5 text-neutral-500">
        Ce flux utilise un lien magique envoyé par Supabase Auth. Après validation, l’utilisateur
        revient dans l’application puis est redirigé vers la page demandée. [web:572][web:575]
      </p>
    </form>
  );
}