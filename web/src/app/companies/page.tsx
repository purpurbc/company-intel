import { CompanySearch } from "@/src/components/company/CompanySearch";

export default function CompaniesPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <CompanySearch />
      </div>
    </main>
  );
}
