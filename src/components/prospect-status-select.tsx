"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Mise à jour..." : "Mettre à jour"}
    </button>
  );
}

export default function ProspectStatusSelect({
  prospectId,
  currentStatus,
  action,
}: {
  prospectId: string;
  currentStatus: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="prospectId" value={prospectId} />

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-neutral-700">
          Statut du pipeline
        </span>

        <select
          name="statut"
          defaultValue={currentStatus}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-950"
        >
          <option value="découvert">Découvert</option>
          <option value="contacté">Contacté</option>
          <option value="rdv">RDV</option>
          <option value="mandat signé">Mandat signé</option>
        </select>
      </label>

      <SubmitButton />
    </form>
  );
}