export default function PosLoading() {
  return (
    <div className="animate-[jacoFade_0.25s_ease] flex gap-5 h-[calc(100vh-140px)]">
      <div className="flex-1 space-y-4">
        <div className="bg-white border border-[#e8ecf2] rounded-2xl p-4">
          <div className="h-[50px] bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white border border-[#e8ecf2] rounded-2xl flex-1 p-5">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-[52px] bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        </div>
      </div>
      <div className="w-[320px] bg-white border border-[#e8ecf2] rounded-2xl p-5 space-y-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
