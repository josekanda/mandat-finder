"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setMessage("Identifiants incorrects. Vérifiez votre email et mot de passe.");
      return;
    }

    router.push(next);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#CCC]">
          Adresse email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@agence.ca"
          className="w-full rounded-xl border border-[#272727] bg-[#1C1C1C] px-4 py-3 text-sm text-[#F0F0F0] outline-none transition placeholder:text-[#555] focus:border-[#C9A84C]"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#CCC]">
          Mot de passe
        </span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-[#272727] bg-[#1C1C1C] px-4 py-3 text-sm text-[#F0F0F0] outline-none transition placeholder:text-[#555] focus:border-[#C9A84C]"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C97A] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Connexion…" : "Se connecter"}
      </button>

      {message && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {message}
        </div>
      )}
    </form>
  );
}
