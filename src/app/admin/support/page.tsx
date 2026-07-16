"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MessageSquare, ChevronRight, Clock, CircleCheck, CircleAlert, ArrowLeft, Send, Building2 } from "lucide-react";

interface AdminTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  tenantName: string;
  tenantSlug: string;
  lastMessage: string | null;
  lastAuthorType: string | null;
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

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState("");

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    try {
      const res = await fetch("/api/admin/support/tickets");
      setTickets(await res.json());
    } catch { toast.error("Error al cargar tickets"); }
    finally { setLoading(false); }
  }

  async function openTicket(t: AdminTicket) {
    setSelectedTicket(t);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${t.id}`);
      const data = await res.json();
      setTicketMessages(data.messages || []);
    } catch { toast.error("Error al cargar mensajes"); }
    finally { setLoadingMessages(false); }
  }

  async function sendReply() {
    if (!reply.trim() || !selectedTicket) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      });
      if (res.ok) {
        const msg = await res.json();
        setTicketMessages((prev) => [...prev, msg]);
        setReply("");
        setSelectedTicket((prev) => prev ? { ...prev, status: "awaiting" } : null);
        loadTickets();
      } else toast.error("Error");
    } catch { toast.error("Error de red"); }
  }

  async function closeTicket() {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      if (res.ok) {
        toast.success("Ticket cerrado");
        setSelectedTicket((prev) => prev ? { ...prev, status: "closed" } : null);
        loadTickets();
      } else toast.error("Error");
    } catch { toast.error("Error de red"); }
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

  const openCount = tickets.filter((t) => t.status === "open" || t.status === "awaiting").length;

  return (
    <div className="animate-[jacoFade_0.25s_ease] max-w-4xl">
      {selectedTicket ? (
        <>
          <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground hover:text-foreground mb-4 transition">
            <ArrowLeft className="size-[15px]" /> Volver a tickets
          </button>

          <div className="bg-card rounded-2xl border border-border shadow-sm mb-4">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-extrabold text-foreground">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Building2 className="size-3.5" /> {selectedTicket.tenantName}
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(selectedTicket.status)}
                    <span className="text-[12px] text-muted-foreground">{statusText(selectedTicket.status)}</span>
                  </div>
                </div>
              </div>
              {selectedTicket.status !== "closed" && (
                <button onClick={closeTicket} className="px-3 py-1.5 rounded-[8px] border border-border text-[11px] font-bold text-muted-foreground hover:bg-muted transition">
                  Cerrar ticket
                </button>
              )}
            </div>
            <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              {loadingMessages ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
              ) : (
                ticketMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.authorType === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.authorType === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.authorType === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {msg.authorType === "admin" ? "Tú" : selectedTicket.tenantName} · {new Date(msg.createdAt).toLocaleDateString("es-CR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
                placeholder="Escribe una respuesta..."
                className="flex-1 px-4 py-3 border border-input rounded-[10px] text-[13px] bg-background text-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 resize-none"
              />
              <button onClick={sendReply} className="px-4 py-3 bg-primary text-white rounded-[10px] text-[13px] font-bold hover:bg-primary/90 transition flex items-center gap-1.5">
                <Send className="size-[15px]" />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Soporte</h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">{openCount} tickets abiertos</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center border border-border">
              <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-[14px] font-semibold text-muted-foreground">No hay tickets de soporte</p>
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
                      <div className="text-[14px] font-bold text-foreground truncate flex items-center gap-2">
                        {t.subject}
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t.tenantName}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        {t.lastAuthorType === "admin" ? "Respondiste" : "Esperando respuesta"} · {t.messageCount} mensajes
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
        </>
      )}
    </div>
  );
}
