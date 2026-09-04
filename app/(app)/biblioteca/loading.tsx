export default function BibliotecaLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="h-7 w-48 rounded bg-white/5" />
      <div className="h-10 w-full rounded-lg bg-white/5" />
      <div className="h-16 w-full rounded-xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
