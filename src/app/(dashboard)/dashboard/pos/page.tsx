"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export default function PosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [cameraOpen, setCameraOpen] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((data) => setProducts(Array.isArray(data) ? data : []));
    fetch("/api/members").then((r) => r.json()).then((data) => setMembers(Array.isArray(data) ? data : [])).catch(() => setMembers([]));
  }, []);

  // Focus scan input on click, but not on form elements (select, button, etc.)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "SELECT" || target.tagName === "INPUT" || target.tagName === "BUTTON" || target.closest("select, button, input, textarea, [role='combobox']")) return;
      scanRef.current?.focus();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Barcode scanner: reads input + Enter
  useEffect(() => {
    if (!scanInput) return;
    const timer = setTimeout(async () => {
      const barcode = scanInput.trim();
      if (!barcode) return;
      setScanInput("");

      // Check local products first
      const local = products.find((p) => p.barcode === barcode);
      if (local) {
        addToCart(local);
        return;
      }

      // Lookup via API
      try {
        const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
        if (res.ok) {
          const p = await res.json();
          setProducts((prev) => {
            if (!prev.find((x) => x.id === p.id)) return [...prev, p];
            return prev;
          });
          addToCart(p);
        } else {
          toast.error("Producto no encontrado");
        }
      } catch {
        toast.error("Error al buscar código");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [scanInput, products]);

  async function openCamera() {
    setCameraOpen(true);
    // Dynamic import so it only loads when needed
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("camera-scanner");
    html5QrCodeRef.current = scanner;
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      async (decodedText: string) => {
        // Barcode detected
        scanner.stop().catch(() => {});
        setCameraOpen(false);
        const barcode = decodedText.trim();
        // Look up locally
        const local = products.find((p) => p.barcode === barcode);
        if (local) { addToCart(local); return; }
        try {
          const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
          if (res.ok) {
            const p = await res.json();
            setProducts((prev) => prev.find((x) => x.id === p.id) ? prev : [...prev, p]);
            addToCart(p);
          } else {
            toast.error("Producto no encontrado");
          }
        } catch {
          toast.error("Error al buscar código");
        }
      },
      () => {}, // ignore qr code errors
    ).catch(() => {
      toast.error("Error al acceder a la cámara");
      setCameraOpen(false);
    });
  }

  function closeCamera() {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
    setCameraOpen(false);
  }

  const addToCart = useCallback((product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Stock insuficiente");
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
            : i
        );
      }
      if (product.stock <= 0) {
        toast.error("Sin stock");
        return prev;
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, total: product.price }];
    });
  }, []);

  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search))
    : [];

  const total = cart.reduce((sum, i) => sum + i.total, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.productId !== productId);
      const product = products.find((p) => p.id === productId);
      if (product && newQty > product.stock) {
        toast.error("Stock insuficiente");
        return prev;
      }
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: newQty, total: newQty * i.price } : i
      );
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function completeSale() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          memberId: selectedMember || null,
          method: paymentMethod,
        }),
      });
      if (res.ok) {
        toast.success(`Venta completada — ₡${total.toLocaleString("de-DE")}`);
        setCart([]);
        setSelectedMember("");
        // Reload products to get updated stock
        fetch("/api/products").then((r) => r.json()).then((data) => setProducts(Array.isArray(data) ? data : []));
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al procesar venta");
      }
    } catch {
      toast.error("Error al procesar venta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-[jacoFade_0.25s_ease] h-[calc(100vh-120px)] flex flex-col">
      {/* Scanner + layout */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left: scanner + cart */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scanner input */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  ref={scanRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Escanea código de barras..."
                  className="w-full px-4 py-3.5 border-2 border-primary rounded-[10px] text-[16px] font-sans text-foreground bg-card placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary rounded" />
                </div>
              </div>
              <button
                onClick={openCamera}
                className="flex items-center gap-2 px-4 py-3.5 bg-card border-2 border-border rounded-[10px] text-[13px] font-bold text-muted-foreground hover:bg-muted transition cursor-pointer shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Cámara
              </button>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-48 px-3 py-3.5 border border-border rounded-[10px] text-[14px] font-sans text-foreground bg-card placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition"
              />
            </div>
            {/* Search results dropdown */}
            {search && filteredProducts.length > 0 && (
              <div className="mt-2 border border-border rounded-2xl overflow-hidden">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { addToCart(p); setSearch(""); searchRef.current?.focus(); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted flex items-center justify-between transition text-sm"
                  >
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className="font-bold text-primary">₡{p.price.toLocaleString("de-DE")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-[14px] border-b border-border shrink-0">
              <div className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                Carrito {itemCount > 0 && `(${itemCount} items)`}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 py-12">
                  <ShoppingCart className="size-12 mb-3 text-muted-foreground mx-auto" />
                  <p className="font-bold text-base">Carrito vacío</p>
                  <p className="text-sm">Escanea productos para agregarlos</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between px-5 py-3">
                      <div className="flex-1">
                        <div className="text-[13.5px] font-bold text-foreground">{item.name}</div>
                        <div className="text-[12px] text-muted-foreground/60">₡{item.price.toLocaleString("de-DE")} c/u</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-muted rounded-lg px-1.5 py-0.5">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-card transition font-bold text-lg">−</button>
                          <span className="w-8 text-center text-[14px] font-extrabold text-foreground">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-card transition font-bold text-lg">+</button>
                        </div>
                        <span className="w-[90px] text-right text-[14px] font-extrabold text-foreground">₡{item.total.toLocaleString("de-DE")}</span>
                        <button onClick={() => removeFromCart(item.productId)} className="text-muted-foreground/60 hover:text-red-500 transition p-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: summary */}
        <div className="w-[320px] flex flex-col">
          <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col min-h-0">
            <div className="px-5 py-[14px] border-b border-border shrink-0">
              <div className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Resumen</div>
            </div>
            <div className="flex-1 p-5 space-y-4">
              {/* Member */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Socio (opcional)</label>
                <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-[10px] text-[13px] font-semibold font-sans text-foreground bg-card cursor-pointer focus:outline-none focus:border-primary transition">
                  <option value="">Sin socio</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "efectivo", label: "Efectivo" },
                    { value: "sinpe", label: "SINPE" },
                    { value: "transferencia", label: "Transferencia" },
                    { value: "tarjeta", label: "Tarjeta" },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`px-3 py-2.5 rounded-[10px] text-[12px] font-bold border transition ${paymentMethod === m.value ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-border" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-[13px] text-muted-foreground">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex justify-between text-[13px] text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₡{total.toLocaleString("de-DE")}</span>
                </div>
                <div className="flex justify-between text-[18px] font-extrabold text-foreground pt-1 border-t border-border">
                  <span>Total</span>
                  <span>₡{total.toLocaleString("de-DE")}</span>
                </div>
              </div>

              <button
                onClick={completeSale}
                disabled={cart.length === 0 || submitting}
                className="w-full py-4 border-none rounded-[10px] text-[15px] font-bold font-sans bg-primary text-primary-foreground cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Procesando..." : `Completar venta — ₡${total.toLocaleString("de-DE")}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera overlay */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl overflow-hidden w-full max-w-[500px] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="text-[15px] font-extrabold text-foreground">Escanear código</div>
                <div className="text-[12px] text-muted-foreground/60">Apunta la cámara al código de barras</div>
              </div>
              <button onClick={closeCamera} className="p-2 hover:bg-muted rounded-lg transition cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div id="camera-scanner" ref={cameraRef} className="w-full aspect-[4/3] bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
