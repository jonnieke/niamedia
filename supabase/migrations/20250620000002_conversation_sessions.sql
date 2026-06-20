-- Conversation sessions: one row per user, updated in place
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  context     jsonb       DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- One active session per user
CREATE UNIQUE INDEX IF NOT EXISTS conversation_sessions_user_id_key
  ON public.conversation_sessions(user_id);

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own session"
  ON public.conversation_sessions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
