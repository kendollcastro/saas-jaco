export default function ReportsLoading() {
  return (
    <div className="animate-[jacoFade_0.25s_ease] space-y-5">
      <div className="h-8 w-40 bg-muted/50 rounded-md animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-72 bg-card rounded-2xl animate-pulse border border-border" />)}
      </div>
    </div>
  );
}
