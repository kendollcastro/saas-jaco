-- Add sessionsPerWeek to MembershipPlan
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "sessionsPerWeek" INTEGER;

-- Add memberId + unique constraint to ScheduleBooking (prevent duplicate bookings)
ALTER TABLE "ScheduleBooking" ADD COLUMN IF NOT EXISTS "memberId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleBooking_slotId_date_memberId_key"
  ON "ScheduleBooking"("slotId", "date", "memberId");
CREATE INDEX IF NOT EXISTS "ScheduleBooking_memberId_date_idx"
  ON "ScheduleBooking"("memberId", "date");
ALTER TABLE "ScheduleBooking" ADD CONSTRAINT "ScheduleBooking_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
