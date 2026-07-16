export default function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f182a]">
      <div className="bg-[#1a2744] rounded-2xl p-10 w-full max-w-[420px] mx-4 space-y-6">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <div className="w-32 h-5 bg-white/10 rounded-md animate-pulse mx-auto" />
          <div className="w-48 h-4 bg-white/10 rounded-md animate-pulse mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="w-full h-11 bg-white/10 rounded-xl animate-pulse" />
          <div className="w-full h-11 bg-white/10 rounded-xl animate-pulse" />
          <div className="w-full h-11 bg-white/10 rounded-xl animate-pulse" />
          <div className="w-full h-11 bg-white/15 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
