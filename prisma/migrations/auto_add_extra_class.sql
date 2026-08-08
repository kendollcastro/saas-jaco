-- Extra class: link a payment to a pending schedule booking
ALTER TABLE "PaymentLink" ADD COLUMN IF NOT EXISTS "scheduleBookingId" TEXT;
CREATE INDEX IF NOT EXISTS "PaymentLink_scheduleBookingId_idx" ON "PaymentLink"("scheduleBookingId");
ALTER TABLE "PaymentLink" ADD CONSTRAINT "PaymentLink_scheduleBookingId_fkey"
  FOREIGN KEY ("scheduleBookingId") REFERENCES "ScheduleBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Configurable price for extra classes
ALTER TABLE "TenantSetting" ADD COLUMN IF NOT EXISTS "extraClassPrice" INTEGER NOT NULL DEFAULT 3000;
