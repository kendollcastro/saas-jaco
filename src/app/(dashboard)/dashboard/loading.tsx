export default function DashboardLoading() {
  return (
    <div className="animate-[jacoFade_0.25s_ease] space-y-6">
      <div className="w-44 h-7 bg-muted/50 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="w-20 h-4 bg-muted rounded animate-pulse" />
            <div className="w-16 h-8 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
