/** Neutral loading state for app pages: a title line and a grid of cards. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-8 space-y-3">
        <div className="h-7 w-40 rounded bg-surface-2" />
        <div className="h-4 w-64 rounded bg-surface" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[118px] rounded-lg border bg-surface" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-lg border bg-surface" />
    </div>
  );
}
