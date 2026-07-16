# Checklist Ola Saas

## ✅ Completado
- [x] Auth con Supabase (login, register, callback)
- [x] Middleware de protección (dashboard + API)
- [x] Layout responsive (sidebar, topbar, dark mode)
- [x] Dashboard con stats y widgets modulares
- [x] Settings (negocio, impuestos, SINPE, módulos)
- [x] Temas (5 colores, logo, vista previa en tiempo real)
- [x] Logo drag & drop
- [x] Formato AM/PM en horarios
- [x] Booking (CRUD, filtros, estados, slide-over)
- [x] Servicios (CRUD)
- [x] Staff (CRUD)
- [x] Productos (CRUD + barcode + cámara)
- [x] POS (scanner, carrito, socio, métodos de pago, stock)
- [x] Ventas (API con descuento de stock)
- [x] Socios (CRUD, tabs por estado, WhatsApp, renovación)
- [x] Pagos de socios (con extensión de membresía)
- [x] Notificaciones (próximos a vencer, WhatsApp, "Hecho")
- [x] Calendario mensual (admin, con badge de count + scroll)
- [x] Slots de horario (CRUD por día)
- [x] Portal de Socios (registro, login PIN, dashboard, reservar, pagos)
- [x] Skill find-skills
- [x] Skill vercel-react-best-practices
- [x] Skill web-design-guidelines
- [x] Skill ui-ux-pro-max
- [x] Skill supabase
- [x] Seed data (servicios, staff, bookings, socios, slots, reservas)
- [x] Hydration warning fix

## 🔴 Bloqueado / Pendiente
- [ ] **Rotar .env con credenciales reales** — DB password + Supabase keys están en git. Hay que rotar keys o mover a `.env.local` y limpiar historial.
- [ ] **Hacienda CR** — Firma digital (PKCS#12), generación XML, envío a Ministerio de Hacienda

## 🟡 Por hacer (corto plazo)
- [ ] **Socios pendientes** — Agregar tab "Pendientes" en Socios para ver registros del portal que subieron comprobante
- [ ] **Ver comprobante** — Mostrar la foto del recibo en el detalle de pago del socio
- [ ] **Confirmar pago** — Botón para que admin confirme el pago y active la membresía
- [ ] **Notificaciones de portal** — wa.me booking confirmation cuando un cliente reserva

## 🟢 Próximos (mediano plazo)
- [ ] Subdominios multi-tenant (`[slug].olasaas.com`)
- [ ] Portal: email/phone OTP como alternativa al PIN
- [ ] Portal: ver historial completo de reservas
- [ ] Portal: cancelar reserva desde el panel
- [ ] Panel admin: ver quién reservó desde el portal vs creado manual
- [ ] Attendance: UI de check-in/check-out
- [ ] Factura Electrónica: XML + Hacienda API
- [ ] Pruebas con usuario real (gimnasio)
