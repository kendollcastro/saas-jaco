"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import SlideOver from "@/components/slide-over";
import { Package } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";

interface Product {
  id: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  cost: number | null;
  stock: number;
  category: string;
  active: boolean;
}

const categoryLabels: Record<string, string> = {
  general: "General",
  bebidas: "Bebidas",
  suplementos: "Suplementos",
  ropa: "Ropa / Merch",
  snacks: "Snacks",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const PAGE_SIZE = 20;
  const [cameraOpen, setCameraOpen] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map((p) => p.id)));
    }
  }

  async function batchDelete() {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
    }
    toast.success(`${selectedIds.size} producto${selectedIds.size !== 1 ? "s" : ""} eliminado${selectedIds.size !== 1 ? "s" : ""}`);
    setSelectedIds(new Set());
    setBatchDeleteOpen(false);
    load();
  }
  const [scanTarget, setScanTarget] = useState<"barcode">("barcode");
  const barcodeRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  let html5QrCodeRef: any = null;

  async function openCamera() {
    setCameraOpen(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("product-camera-scanner");
    html5QrCodeRef = scanner;
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText: string) => {
        scanner.stop().catch(() => {});
        setCameraOpen(false);
        if (barcodeRef.current) {
          barcodeRef.current.value = decodedText.trim();
        }
      },
      () => {},
    ).catch(() => {
      toast.error("Error al acceder a la cámara");
      setCameraOpen(false);
    });
  }

  function closeCamera() {
    if (html5QrCodeRef) html5QrCodeRef.stop().catch(() => {});
    setCameraOpen(false);
  }

  function load() {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar productos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { setPage(0); setSelectedIds(new Set()); }, [search]);

  useEffect(() => { load(); }, []);

  const filtered = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;
  const paginatedData = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"),
      description: fd.get("description"),
      barcode: fd.get("barcode"),
      price: fd.get("price"),
      cost: fd.get("cost"),
      stock: fd.get("stock"),
      category: fd.get("category"),
    };

    try {
      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success(editing ? "Producto actualizado" : "Producto creado");
        setShowForm(false);
        setEditing(null);
        load();
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  function deleteProduct(id: string) {
    setPendingAction(() => async () => {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Producto eliminado");
          load();
        } else {
          toast.error("Error al eliminar");
        }
      } catch {
        toast.error("Error al eliminar");
      }
    });
    setConfirmOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setShowForm(true);
  }

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[21px] font-extrabold tracking-tight text-foreground">Productos</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-[17px] py-[11px] text-[14px] font-bold cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo producto
        </button>
      </div>

      {products.length > 0 && (
        <div className="relative mb-4 max-w-[280px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..." className="w-full pl-9 pr-3 py-[9px] border border-input rounded-[10px] text-[13px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-[52px] bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="size-10 mb-3 text-muted-foreground mx-auto" />
            <p className="font-bold text-base">{search ? "Sin resultados" : "No hay productos"}</p>
            <p className="text-sm mt-1">Agrega bebidas, suplementos y más</p>
          </div>
        ) : (
          <>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-border">
              <span className="text-[13px] font-bold text-foreground">{selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}</span>
              <div className="flex gap-1.5 ml-auto">
                <button onClick={() => setBatchDeleteOpen(true)} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12px] font-bold border-none cursor-pointer hover:bg-red-600 transition">
                  Eliminar
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-muted-foreground cursor-pointer hover:bg-muted transition">
                  Limpiar
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="w-[40px] px-3 py-3">
                    <input type="checkbox" checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                      onChange={toggleSelectAll}
                      className="size-[15px] rounded border-border accent-primary cursor-pointer" />
                  </th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Producto</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Código</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Categoría</th>
                  <th className="text-right px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Precio</th>
                  <th className="text-right px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Stock</th>
                  <th className="w-[90px] px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((p) => (
                  <tr key={p.id} className={`border-t border-border ${selectedIds.has(p.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)}
                        className="size-[15px] rounded border-border accent-primary cursor-pointer" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-[13.5px] font-bold text-[#1e293b]">{p.name}</div>
                      {p.description && <div className="text-[11.5px] text-muted-foreground">{p.description}</div>}
                    </td>
                    <td className="px-3 py-3 text-[12px] font-mono text-muted-foreground">{p.barcode || "-"}</td>
                    <td className="px-3 py-3 text-[13px] text-muted-foreground">{categoryLabels[p.category] || p.category}</td>
                    <td className="px-3 py-3 text-[13.5px] font-bold text-foreground text-right">₡{p.price.toLocaleString("de-DE")}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-[13.5px] font-bold ${p.stock <= 0 ? "text-red-500" : p.stock < 10 ? "text-amber-500" : "text-foreground"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-primary transition p-1.5" title="Editar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1-1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="text-muted-foreground hover:text-red-500 transition p-1.5" title="Eliminar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pb-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-muted-foreground bg-card hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (page <= 3) {
                    pageNum = i;
                  } else if (page >= totalPages - 4) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-[12px] font-bold transition cursor-pointer ${
                        page === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-muted-foreground bg-card hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
          </>
        )}
      </div>

      <SlideOver
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? "Editar producto" : "Nuevo producto"}
        description={editing ? editing.name : "Agrega un producto al inventario"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-[26px] py-[22px] space-y-[16px]">
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Nombre</label>
              <input name="name" required defaultValue={editing?.name || ""} placeholder="Ej: Agua Cristal 500ml" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Descripción</label>
              <input name="description" defaultValue={editing?.description || ""} placeholder="Opcional" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Código de barras</label>
              <div className="flex gap-2">
                <input ref={barcodeRef} name="barcode" defaultValue={editing?.barcode || ""} placeholder="Ej: 7441023456789" className="flex-1 px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition font-mono" />
                <button type="button" onClick={openCamera} title="Escanear código" className="p-[11px] border border-input rounded-[10px] bg-background text-muted-foreground hover:bg-muted/50 transition cursor-pointer shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Categoría</label>
                <select name="category" defaultValue={editing?.category || "general"} className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-semibold font-sans text-foreground bg-background cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="general">General</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="suplementos">Suplementos</option>
                  <option value="snacks">Snacks</option>
                  <option value="ropa">Ropa / Merch</option>
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Stock actual</label>
                <input name="stock" type="number" defaultValue={editing?.stock || 0} min="0" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background focus:outline-none focus:border-primary transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Precio venta (₡)</label>
                <input name="price" type="number" required defaultValue={editing?.price || ""} min="0" placeholder="2500" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-muted-foreground mb-[7px]">Costo (₡)</label>
                <input name="cost" type="number" defaultValue={editing?.cost || ""} min="0" placeholder="Opcional" className="w-full px-[13px] py-[11px] border border-input rounded-[10px] text-[14px] font-sans text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary transition" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-[26px] py-[18px] border-t border-border shrink-0">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-[12px] border border-input rounded-[10px] text-[14px] font-bold font-sans bg-background text-muted-foreground cursor-pointer hover:bg-muted/50 transition">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-[12px] border-none rounded-[10px] text-[14px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50">
              {submitting ? "Guardando..." : editing ? "Actualizar producto" : "Crear producto"}
            </button>
          </div>
        </form>
      </SlideOver>

      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl overflow-hidden w-full max-w-[500px] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="text-[15px] font-extrabold text-foreground">Escanear código</div>
                <div className="text-[12px] text-muted-foreground">Apunta la cámara al código de barras</div>
              </div>
              <button onClick={closeCamera} className="p-2 hover:bg-muted rounded-lg transition cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div id="product-camera-scanner" ref={cameraRef} className="w-full aspect-[4/3] bg-black" />
          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
        onConfirm={() => { pendingAction?.(); setConfirmOpen(false); setPendingAction(null); }}
        title="Eliminar producto"
        message="¿Eliminar este producto? Esta acción no se puede deshacer."
        variant="danger"
      />
      <ConfirmModal
        open={batchDeleteOpen}
        onClose={() => { setBatchDeleteOpen(false); }}
        onConfirm={batchDelete}
        title={`Eliminar ${selectedIds.size} producto${selectedIds.size !== 1 ? "s" : ""}`}
        message={`¿Eliminar ${selectedIds.size} producto${selectedIds.size !== 1 ? "s" : ""} seleccionado${selectedIds.size !== 1 ? "s" : ""}? Esta acción no se puede deshacer.`}
        variant="danger"
      />
    </div>
  );
}
