-- AddManaged updates shipping routes with day-based departure scheduling
-- This migration adds departureDaysOfWeek to track which days of the week (0=Sunday...6=Saturday) 
-- each route departs, replacing the fixed departureDate model for more flexible scheduling

-- Add departureDaysOfWeek column if it doesn't exist
-- Default to [1] (Monday) for backward compatibility with routes that had Monday departures
ALTER TABLE "ShippingRoute" 
ADD COLUMN IF NOT EXISTS "departureDaysOfWeek" INT[] DEFAULT ARRAY[1];

-- For routes where departureDate exists, infer the day of week
UPDATE "ShippingRoute"
SET "departureDaysOfWeek" = ARRAY[EXTRACT(DOW FROM "departureDate")::INT]
WHERE "departureDate" IS NOT NULL 
AND "departureDaysOfWeek" = ARRAY[1];

-- Create index for route lookups (optional but useful for querying active routes)
CREATE INDEX IF NOT EXISTS "ShippingRoute_departureDaysOfWeek_idx" 
ON "ShippingRoute"("departureDaysOfWeek");

-- Mark departureDate as deprecated in comments (for developer awareness)
-- departureDate is now legacy; use departureDaysOfWeek instead
