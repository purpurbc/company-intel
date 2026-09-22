-- Saved segments describe a reusable company selection. Purpose and free-form
-- notes had no defined product behavior; keep the model limited to one description.
ALTER TABLE app.saved_segment
    DROP COLUMN IF EXISTS intent,
    DROP COLUMN IF EXISTS notes;
