export default function SupportLoading() {
  return (
    <div className="animate-[jacoFade_0.25s_ease] max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="w-32 h-7 bg-muted/50 rounded-md animate-pulse" />
        <div className="w-32 h-9 bg-muted/50 rounded-[10px] animate-pulse" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-3">
            <div className="h-[15px] w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
