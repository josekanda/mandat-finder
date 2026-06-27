"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-950">
            Une erreur inattendue s'est produite
          </h1>
          <p className="text-sm text-neutral-500">
            L'erreur a été signalée automatiquement.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
