"use client";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f182a]">
      <div className="bg-[#1a2744] rounded-2xl p-10 w-full max-w-[420px] mx-4 text-center">
        <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-2xl">!</span>
        </div>
        <h2 className="text-white text-lg font-bold mb-2">Error al cargar</h2>
        <p className="text-gray-400 text-sm mb-6">Algo salió mal. Intenta de nuevo.</p>
        <button
          onClick={reset}
          className="w-full py-3 bg-[#1e40af] text-white rounded-xl font-bold hover:bg-[#1e40af]/90 transition"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
