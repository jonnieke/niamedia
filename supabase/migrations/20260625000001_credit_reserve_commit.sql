-- Safer credit deduction: reserve before AI generation, commit on success, refund on failure.
-- Replaces the "spend before generation" pattern that burned a credit when generation failed.

-- Reserve 1 credit atomically. Logs a 'reserved' transaction and returns its id.
-- Returns NULL when the user has no credits (caller should treat as insufficient_credits).
CREATE OR REPLACE FUNCTION public.reserve_credit(p_user_id uuid, p_description text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_credits integer; v_tx_id uuid;
BEGIN
  SELECT credits INTO v_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_credits IS NULL OR v_credits < 1 THEN RETURN NULL; END IF;
  UPDATE public.profiles SET credits = credits - 1 WHERE id = p_user_id;
  INSERT INTO public.credit_transactions (user_id, amount, description, payment_status)
    VALUES (p_user_id, -1, p_description, 'reserved')
    RETURNING id INTO v_tx_id;
  RETURN v_tx_id;
END;
$$;

-- Commit a reserved credit (generation succeeded). Idempotent: only acts on 'reserved' rows.
CREATE OR REPLACE FUNCTION public.commit_credit(p_tx_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.credit_transactions SET payment_status = 'spent'
    WHERE id = p_tx_id AND payment_status = 'reserved';
END;
$$;

-- Refund a reserved credit (generation failed). Idempotent: only acts on 'reserved' rows,
-- so it can never double-credit or refund an already-spent transaction.
CREATE OR REPLACE FUNCTION public.refund_credit(p_tx_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user uuid;
BEGIN
  SELECT user_id INTO v_user FROM public.credit_transactions
    WHERE id = p_tx_id AND payment_status = 'reserved' FOR UPDATE;
  IF v_user IS NULL THEN RETURN; END IF;
  UPDATE public.profiles SET credits = credits + 1 WHERE id = v_user;
  UPDATE public.credit_transactions SET payment_status = 'refunded' WHERE id = p_tx_id;
END;
$$;
