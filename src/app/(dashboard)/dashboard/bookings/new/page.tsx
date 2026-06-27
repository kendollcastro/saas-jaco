"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      customerName: form.get("customerName"),
      customerPhone: form.get("customerPhone"),
      customerEmail: form.get("customerEmail"),
      serviceName: form.get("serviceName"),
      date: form.get("date"),
      time: form.get("time"),
      pax: Number(form.get("pax")),
      total: Number(form.get("total")),
      deposit: Number(form.get("deposit")),
      notes: form.get("notes"),
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/dashboard/bookings");
      router.refresh();
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nueva reserva</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del cliente</label>
              <Input name="customerName" required placeholder="Ej: Juan Pérez" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <Input name="customerPhone" type="tel" placeholder="+506 8888 8888" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input name="customerEmail" type="email" placeholder="cliente@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Servicio</label>
              <Input name="serviceName" required placeholder="Ej: Clase de surf, Tour ATV, Pesca" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <Input name="date" type="date" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora</label>
                <Input name="time" type="time" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Personas</label>
                <Input name="pax" type="number" min="1" defaultValue="1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total (₡)</label>
                <Input name="total" type="number" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Depósito (₡)</label>
                <Input name="deposit" type="number" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notas</label>
              <textarea
                name="notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Notas adicionales..."
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Crear reserva"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
