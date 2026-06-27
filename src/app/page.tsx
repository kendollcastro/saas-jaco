import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-white mb-2">Jacó SaaS</h1>
        <p className="text-muted-foreground mb-8">
          Plataforma modular para tour operadores y escuelas de surf en Costa Rica
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-accent transition"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
