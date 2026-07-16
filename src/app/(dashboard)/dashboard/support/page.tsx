"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MessageSquare, Plus, ChevronRight, Clock, CircleCheck, CircleAlert, ArrowLeft, Send } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  lastMessage: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  authorType: string;
  createdAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState("");

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    try {
      const res = await fetch("/api/support/tickets");
      setTickets(await res.json());
    } catch { toast.error("Error al cargar tickets"); }
    finally { setLoading(false); }
  }

  async function createTicket() {
    if (!subject || !message) { toast.error("Completa todos los campos"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success("Ticket creado");
      setShowCreate(false);
      setSubject(""); setMessage("");
      loadTickets();
    } catch { toast.error("Error de red"); }
    finally { setSaving(false); }
  }

  async function openTicket(t: Ticket) {
    setSelectedTicket(t);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/support/tickets/${t.id}`);
      const data = await res.json();
      setTicketMessages(data.messages || []);
    } catch { toast.error("Error al cargar mensajes"); }
    finally { setLoadingMessages(false); }
  }

  function statusIcon(status: string) {
    if (status === "closed") return <CircleCheck className="size-3.5 text-emerald-500" />;
    if (status === "awaiting") return <Clock className="size-3.5 text-amber-500" />;
    return <CircleAlert className="size-3.5 text-blue-500" />;
  }

  function statusText(status: string) {
    if (status === "closed") return "Cerrado";
    if (status === "awaiting") return "Esperando respuesta";
    return "Abierto";
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease] max-w-3xl">
      {selectedTicket ? (
        <>
          <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground hover:text-foreground mb-4 transition">
            <ArrowLeft className="size-[15px]" /> Volver a tickets
          </button>

          <div className="bg-card rounded-2xl border border-border shadow-sm mb-4">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-extrabold text-foreground">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {statusIcon(selectedTicket.status)}
                  <span className="text-[12px] text-muted-foreground">{statusText(selectedTicket.status)}</span>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
              {loadingMessages ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
              ) : ticketMessages.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-6">Sin mensajes</p>
              ) : (
                ticketMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.authorType === "admin" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.authorType === "admin" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.authorType === "admin" ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
                        {msg.authorType === "admin" ? "Soporte" : "Tú"} · {new Date(msg.createdAt).toLocaleDateString("es-CR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedTicket.status !== "closed" && (
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-3 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 resize-none"
              />
              <button
                onClick={async () => {
                  if (!reply.trim()) return;
                  try {
                    const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content: reply }),
                    });
                    if (res.ok) {
                      const msg = await res.json();
                      setTicketMessages((prev) => [...prev, msg]);
                      setReply("");
                    } else toast.error("Error");
                  } catch { toast.error("Error de red"); }
                }}
                className="px-4 py-3 bg-primary text-white rounded-[10px] text-[13px] font-bold hover:bg-primary/90 transition flex items-center gap-1.5"
              >
                <Send className="size-[15px]" />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Soporte</h1>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-[10px] text-[12px] font-bold hover:bg-primary/90 transition">
              <Plus className="size-[15px]" /> Nuevo Ticket
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center border border-border">
              <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-[14px] font-semibold text-muted-foreground">No hay tickets de soporte</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-[13px] font-bold text-primary hover:underline">Crear uno</button>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTicket(t)}
                  className="w-full flex items-center justify-between bg-card rounded-xl px-5 py-3.5 border border-border hover:border-primary/30 transition text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon(t.status)}
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-foreground truncate">{t.subject}</div>
                      <div className="text-[12px] text-muted-foreground">
                        {t.lastMessage || "Sin mensajes"} · {t.messageCount} mensajes
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-muted-foreground">{statusText(t.status)}</span>
                    <ChevronRight className="size-[15px] text-muted-foreground/40" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-[17px] font-extrabold text-foreground">Nuevo Ticket</h3>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto"
                  className="w-full px-3 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe tu problema o consulta..."
                  className="w-full px-3 py-2.5 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-[10px] border border-border text-[12px] font-bold text-muted-foreground hover:bg-muted transition">Cancelar</button>
                  <button onClick={createTicket} disabled={saving} className="px-4 py-2 rounded-[10px] bg-primary text-white text-[12px] font-bold hover:bg-primary/90 transition disabled:opacity-50">{saving ? "..." : "Enviar"}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
