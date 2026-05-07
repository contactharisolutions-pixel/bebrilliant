-- VTO Schema Expansion
ALTER TABLE product
    ADD COLUMN IF NOT EXISTS vto_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS vto_overlay_url TEXT, -- Base frame overlay
    ADD COLUMN IF NOT EXISTS vto_config JSONB DEFAULT '{"scale": 1.0, "y_offset": 0}'::jsonb;

ALTER TABLE variant
    ADD COLUMN IF NOT EXISTS vto_overlay_url TEXT; -- Color specific overlay
