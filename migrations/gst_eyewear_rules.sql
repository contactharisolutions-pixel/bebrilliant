-- ============================================================
-- GST Rules Migration — BlinkOpticals Eyewear (India)
-- Correct HSN-based GST rates as per Indian GST Act
--   HSN 9004 — Spectacles/Sunglasses         → 18%
--   HSN 9003 — Frames for spectacles         → 12%
--   HSN 9001 — Optical lenses / Contact lens → 12%
--   HSN 9005 — Binoculars / accessories      → 18%
-- ============================================================

-- Step 1: Deactivate any old catch-all rules that may have wrong %
-- (e.g. the 2.5% rule shown in the UI)
UPDATE tax_rules
SET active_status = FALSE
WHERE tax_percentage < 5 AND applicable_on = 'product';

-- Step 2: Upsert standard eyewear tax rules for each business
-- Replace 'YOUR_BUSINESS_ID' with a real ID or run per-business
-- These are seeded as templates; the ERP UI can override.

-- For simplicity: insert rules without business_id tie (admin seeds them)
-- The /api/tax/rules endpoint will create business-scoped ones.

-- NOTE: Run this per business_id by replacing $BIZ below:
-- Example via psql: \set BIZ 'biz_12345'

DO $$
DECLARE
    biz_id TEXT;
    rule_18 INT;
    rule_12 INT;
    cat_row RECORD;
BEGIN
    FOR biz_id IN SELECT DISTINCT business_id FROM business LOOP

        -- Deactivate incorrect low-rate rules
        UPDATE tax_rules SET active_status = FALSE
        WHERE business_id = biz_id AND tax_percentage < 5;

        -- GST 18% — Sunglasses, frames (HSN 9004) — primary eyewear
        INSERT INTO tax_rules (business_id, tax_name, tax_percentage, applicable_on, active_status)
        VALUES (biz_id, 'GST 18% (Sunglasses/Frames - HSN 9004)', 18.00, 'category', TRUE)
        ON CONFLICT DO NOTHING
        RETURNING id INTO rule_18;

        IF rule_18 IS NULL THEN
            SELECT id INTO rule_18 FROM tax_rules
            WHERE business_id = biz_id AND tax_percentage = 18 AND active_status = TRUE LIMIT 1;
        END IF;

        -- GST 12% — Optical lenses, contact lenses (HSN 9001, 9003)
        INSERT INTO tax_rules (business_id, tax_name, tax_percentage, applicable_on, active_status)
        VALUES (biz_id, 'GST 12% (Lenses/Frames - HSN 9001/9003)', 12.00, 'category', TRUE)
        ON CONFLICT DO NOTHING
        RETURNING id INTO rule_12;

        IF rule_12 IS NULL THEN
            SELECT id INTO rule_12 FROM tax_rules
            WHERE business_id = biz_id AND tax_percentage = 12 AND active_status = TRUE LIMIT 1;
        END IF;

        -- Map categories to correct tax rules
        FOR cat_row IN
            SELECT category_id, LOWER(name) AS name
            FROM category WHERE business_id = biz_id
        LOOP
            DECLARE mapped_rule INT;
            BEGIN
                -- Lenses & contact lenses → 12%
                IF cat_row.name ILIKE '%lens%' OR cat_row.name ILIKE '%contact%' OR cat_row.name ILIKE '%frame%' THEN
                    mapped_rule := rule_12;
                -- Sunglasses, eyewear, accessories → 18%
                ELSE
                    mapped_rule := rule_18;
                END IF;

                INSERT INTO category_tax_mapping (category_id, business_id, tax_rule_id)
                VALUES (cat_row.category_id, biz_id, mapped_rule)
                ON CONFLICT (category_id, business_id) DO UPDATE
                    SET tax_rule_id = EXCLUDED.tax_rule_id;
            END;
        END LOOP;

    END LOOP;
END $$;
