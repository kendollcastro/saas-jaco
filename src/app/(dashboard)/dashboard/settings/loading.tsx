export default function SettingsLoading() {
  return (
    <div className="animate-[jacoFade_0.25s_ease] space-y-6">
      <div className="w-44 h-7 bg-muted/50 rounded-lg animate-pulse" />
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="w-24 h-3 bg-muted rounded animate-pulse" />
              <div className="w-full h-11 bg-muted rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
        <div className="w-full h-11 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
