import { SkeletonBlock, SkeletonLine } from "@/src/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <SkeletonLine className="w-16" />
        <SkeletonBlock className="h-32" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-24" />
          ))}
        </div>
        <SkeletonBlock className="h-72" />
      </div>
    </main>
  );
}
