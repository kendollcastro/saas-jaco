export default function CheckinLoading() {
  return (
    <div className="animate-[jacoFade_0.25s_ease] max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="w-36 h-5 bg-muted/50 rounded-md animate-pulse" />
          <div className="w-52 h-3 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="w-full aspect-square bg-black/90 flex items-center justify-center">
          <div className="w-40 h-40 border-2 border-white/20 rounded-xl animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="size-[16px] rounded-full bg-primary/60 animate-pulse" />
          <div className="w-36 h-3 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
