-- AlterTable: Add new fields to addons table for hourly pricing
ALTER TABLE "addons" ADD COLUMN "pricing_type" VARCHAR(20) DEFAULT 'per_item';
ALTER TABLE "addons" ADD COLUMN "hourly_rate" DECIMAL(10, 2);

-- AlterTable: Add time-related fields to reservation_addons table
ALTER TABLE "reservation_addons" ADD COLUMN "start_time" TIME;
ALTER TABLE "reservation_addons" ADD COLUMN "end_time" TIME;
ALTER TABLE "reservation_addons" ADD COLUMN "duration_hours" INTEGER;

-- DropIndex: Remove unique constraint on reservation_id + addon_id to allow multiple bookings of same addon with different times
ALTER TABLE "reservation_addons" DROP CONSTRAINT IF EXISTS "unique_reservation_addon";
