import { CompanySearch } from "@/src/components/company/CompanySearch";

export default function HomePage() {
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Company Intel</h1>
      <CompanySearch />
    </main>
  );
}