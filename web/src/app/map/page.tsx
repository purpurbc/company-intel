import { BackLink } from "@/src/components/ui/BackLink";
import { SwedenBoundaryMap } from "@/src/components/map/SwedenBoundaryMap";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackLink href="/">Tillbaka</BackLink>
        <SwedenBoundaryMap />
      </div>
    </main>
  );
}
