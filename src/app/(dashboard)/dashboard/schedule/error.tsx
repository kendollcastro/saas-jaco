"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="text-center py-16 text-muted-foreground"><p className="font-bold text-base">Error al cargar horarios</p><button onClick={reset} className="mt-3 text-sm text-primary font-bold cursor-pointer">Reintentar</button></div>;
}
