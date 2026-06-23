import { DashboardPromptBar } from "./DashboardPromptBar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-app-bg p-4 text-app-text sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-4xl flex-col items-center pt-[28vh]">
        <section className="w-full text-center">
          <h1 className="text-xl font-semibold text-app-text">
            Cintela - hitta rätt bolag
          </h1>
          <DashboardPromptBar />
        </section>
      </div>
    </main>
  );
}
