export default function HomePage() {
  return (
    <main className="min-h-screen bg-app-bg p-4 text-app-text sm:p-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-md border border-app-border bg-app-panel p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">
            Cintela
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-text-muted">
            En ren startsida för daglig överblick. Sök och filtrering ligger nu
            på en separat företagssida.
          </p>
        </section>
      </div>
    </main>
  );
}
