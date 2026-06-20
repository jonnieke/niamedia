-- Credits column on profiles (1 free campaign for every user)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 1;

-- Credit transaction log
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  description text NOT NULL,
  order_id text,
  order_tracking_id text,
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Atomic: deduct 1 credit, return false if insufficient
CREATE OR REPLACE FUNCTION public.spend_credit(p_user_id uuid, p_description text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_credits integer;
BEGIN
  SELECT credits INTO v_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_credits IS NULL OR v_credits < 1 THEN RETURN false; END IF;
  UPDATE public.profiles SET credits = credits - 1 WHERE id = p_user_id;
  INSERT INTO public.credit_transactions (user_id, amount, description)
    VALUES (p_user_id, -1, p_description);
  RETURN true;
END;
$$;

-- Add credits after payment — called by pesapal-ipn service role
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text,
  p_order_id text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET credits = credits + p_amount WHERE id = p_user_id;
  UPDATE public.credit_transactions SET payment_status = 'paid'
    WHERE order_id = p_order_id;
END;
$$;
