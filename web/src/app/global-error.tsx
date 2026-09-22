"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="sv">
      <body>
        <main className="mx-auto max-w-xl p-6 font-sans">
          <h1 className="text-xl font-semibold">Cintela kunde inte starta</h1>
          <p className="mt-2 text-sm">Försök att ladda om applikationen.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded border px-3 py-1.5 text-xs font-semibold"
          >
            Försök igen
          </button>
        </main>
      </body>
    </html>
  );
}
