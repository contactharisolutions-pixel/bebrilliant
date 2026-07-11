-- Create device push tokens table
CREATE TABLE IF NOT EXISTS public.mobile_push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.mobile_push_tokens ENABLE ROW LEVEL SECURITY;

-- Select/Insert policies
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.mobile_push_tokens;
CREATE POLICY "Users can manage their own tokens" ON public.mobile_push_tokens
  FOR ALL USING (user_id = auth.uid());
