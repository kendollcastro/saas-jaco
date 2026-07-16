export default function ProductsLoading() {
  return (
    <div className="animate-[jacoFade_0.25s_ease] space-y-6">
      <div className="flex items-center justify-between">
        <div className="w-32 h-7 bg-muted/50 rounded-lg animate-pulse" />
        <div className="w-36 h-10 bg-muted/50 rounded-xl animate-pulse" />
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />)}
      </div>
    </div>
  );
}
