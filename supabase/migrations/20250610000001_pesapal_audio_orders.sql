-- Add PesaPal payment columns to audio_orders
ALTER TABLE public.audio_orders
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS order_tracking_id text;

-- Index for IPN webhook lookups by tracking ID
CREATE INDEX IF NOT EXISTS audio_orders_tracking_id_idx ON public.audio_orders (order_tracking_id);

-- Also run these if not yet done:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
-- ALTER publication supabase_realtime ADD TABLE notifications;
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'kariukinjoroge13@gmail.com';
