
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'node_questions_map'
    AND policyname = 'service_role_nqm'
  ) THEN
    CREATE POLICY service_role_nqm
      ON node_questions_map FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'syllabus_activity_log'
    AND policyname = 'service_role_sal'
  ) THEN
    CREATE POLICY service_role_sal
      ON syllabus_activity_log FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- Verify migration results
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('syllabus_nodes','syllabus_plans','tenant_syllabus')
  AND column_name IN ('description','difficulty_level','exam_weightage','question_count',
                      'estimated_hours','color_tag','tags','sort_priority',
                      'is_active','subscribers_count','total_revenue','trial_days',
                      'expires_at','access_level','notes','distributed_by')
ORDER BY table_name, column_name;

SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('node_questions_map','syllabus_activity_log');

SELECT relname AS table_name FROM pg_class
WHERE relname IN ('node_questions_map','syllabus_activity_log')
  AND relkind = 'r';
