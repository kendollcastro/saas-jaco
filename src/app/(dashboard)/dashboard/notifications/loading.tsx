export default function NotificationsLoading() {
  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="w-40 h-7 bg-muted/50 rounded-md animate-pulse" />
          <div className="w-48 h-3 bg-muted/50 rounded mt-2 animate-pulse" />
        </div>
        <div className="w-28 h-10 bg-muted/50 rounded-xl animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-5">
            <div className="h-[18px] w-40 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => <div key={j} className="h-[56px] bg-muted rounded-lg animate-pulse" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
