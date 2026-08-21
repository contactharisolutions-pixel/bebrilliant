-- ============================================================
-- BeBrilliant: Exam Format Templates — Enterprise Enhancements
-- ============================================================

-- 1. paper_templates enhancements
ALTER TABLE paper_templates ADD COLUMN IF NOT EXISTS version         integer DEFAULT 1;
ALTER TABLE paper_templates ADD COLUMN IF NOT EXISTS tags            text[]  DEFAULT '{}';
ALTER TABLE paper_templates ADD COLUMN IF NOT EXISTS usage_count     integer DEFAULT 0;
ALTER TABLE paper_templates ADD COLUMN IF NOT EXISTS last_used_at    timestamptz;
ALTER TABLE paper_templates ADD COLUMN IF NOT EXISTS description     text;
ALTER TABLE paper_templates ADD COLUMN IF NOT EXISTS syllabus_node_id uuid REFERENCES syllabus_nodes(id) ON DELETE SET NULL;
ALTER TABLE paper_templates ADD COLUMN IF NOT EXISTS cloned_from     uuid REFERENCES paper_templates(id) ON DELETE SET NULL;

-- 2. template_sections enhancements
ALTER TABLE template_sections ADD COLUMN IF NOT EXISTS instructions      text;
ALTER TABLE template_sections ADD COLUMN IF NOT EXISTS time_limit_minutes integer;

-- 3. section_question_rules enhancements
ALTER TABLE section_question_rules ADD COLUMN IF NOT EXISTS topic_filter  text[]  DEFAULT '{}';

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_paper_templates_category    ON paper_templates(category);
CREATE INDEX IF NOT EXISTS idx_paper_templates_is_global   ON paper_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_paper_templates_tags        ON paper_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_paper_templates_created_at  ON paper_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_sections_template  ON template_sections(template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_sqr_section_order           ON section_question_rules(section_id, order_index);
