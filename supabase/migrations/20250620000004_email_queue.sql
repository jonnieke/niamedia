CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text NOT NULL,
  email_type text NOT NULL, -- 'welcome' | 'day2_nudge' | 'day5_social_proof'
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending', -- pending | sent | failed
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) can read/write
CREATE INDEX IF NOT EXISTS email_queue_status_scheduled
  ON public.email_queue (status, scheduled_at)
  WHERE status = 'pending';
