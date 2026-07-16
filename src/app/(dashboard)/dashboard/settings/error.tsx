"use client";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-5">
        <span className="text-red-500 text-3xl font-bold">!</span>
      </div>
      <h2 className="text-foreground text-xl font-extrabold mb-2">Error al cargar configuración</h2>
      <p className="text-muted-foreground text-sm mb-6">Intenta de nuevo.</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
