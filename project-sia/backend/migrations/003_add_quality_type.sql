-- Adds quality_type classification used for customer preference filtering
-- Allowed values: genuine, aftermarket, unknown

ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS quality_type TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE accessories
ADD COLUMN IF NOT EXISTS quality_type TEXT NOT NULL DEFAULT 'unknown';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'spare_parts_quality_type_check'
  ) THEN
    ALTER TABLE spare_parts
    ADD CONSTRAINT spare_parts_quality_type_check
    CHECK (quality_type IN ('genuine', 'aftermarket', 'unknown'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'accessories_quality_type_check'
  ) THEN
    ALTER TABLE accessories
    ADD CONSTRAINT accessories_quality_type_check
    CHECK (quality_type IN ('genuine', 'aftermarket', 'unknown'));
  END IF;
END $$;

-- Lightweight heuristic backfill for existing rows
UPDATE spare_parts
SET quality_type = CASE
  WHEN LOWER(COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(sku, '')) ~ '(rcb|cnc|jvt|koso|racing|aftermarket|performance)'
    THEN 'aftermarket'
  ELSE 'genuine'
END
WHERE quality_type = 'unknown';

UPDATE accessories
SET quality_type = CASE
  WHEN LOWER(COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(sku, '')) ~ '(rcb|cnc|jvt|koso|racing|aftermarket|performance)'
    THEN 'aftermarket'
  ELSE 'genuine'
END
WHERE quality_type = 'unknown';
