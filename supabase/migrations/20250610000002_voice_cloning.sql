-- Voice profiles: one row per voice slot
CREATE TABLE IF NOT EXISTS public.voice_profiles (
  slot_id        text PRIMARY KEY,
  label          text NOT NULL,
  age_group      text NOT NULL,
  gender         text NOT NULL CHECK (gender IN ('M','F')),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cloning','ready','failed')),
  elevenlabs_voice_id text,
  sample_count   int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Voice samples: uploaded audio files per slot
CREATE TABLE IF NOT EXISTS public.voice_samples (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id        text NOT NULL REFERENCES public.voice_profiles(slot_id) ON DELETE CASCADE,
  storage_path   text NOT NULL,
  file_name      text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Seed: 14 voice slots (Kids → Elder, African accent)
INSERT INTO public.voice_profiles (slot_id, label, age_group, gender) VALUES
  ('af-child-f',  'Girl — Bright & Clear',     'Kids',        'F'),
  ('af-child-m',  'Boy — Playful',              'Kids',        'M'),
  ('af-teen-f',   'Teen Girl — Energetic',      'Teens',       'F'),
  ('af-teen-m',   'Teen Boy — Confident',       'Teens',       'M'),
  ('km-f',        'Nairobi Woman — Warm',       'Young Adult', 'F'),
  ('km-m',        'Nairobi Man — Deep',         'Young Adult', 'M'),
  ('sw-f',        'Coastal Woman — Melodic',    'Young Adult', 'F'),
  ('sw-m',        'Coastal Man — Smooth',       'Young Adult', 'M'),
  ('ng-f',        'Highlands Woman — Clear',    'Young Adult', 'F'),
  ('sa-m',        'Savanna Man — Bold',         'Young Adult', 'M'),
  ('af-mature-f', 'Mature Woman — Authoritative','Mature',     'F'),
  ('af-mature-m', 'Mature Man — Trusted',       'Mature',      'M'),
  ('af-elder-f',  'Elder Woman — Warm & Wise',  'Elder',       'F'),
  ('af-elder-m',  'Elder Man — Commanding',     'Elder',       'M')
ON CONFLICT (slot_id) DO NOTHING;

-- RLS: admin full access, others read-only
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_samples  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voice_profiles_admin" ON public.voice_profiles;
DROP POLICY IF EXISTS "voice_profiles_read"  ON public.voice_profiles;
DROP POLICY IF EXISTS "voice_samples_admin"  ON public.voice_samples;
DROP POLICY IF EXISTS "voice_samples_read"   ON public.voice_samples;

CREATE POLICY "voice_profiles_admin" ON public.voice_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "voice_profiles_read" ON public.voice_profiles
  FOR SELECT USING (true);

CREATE POLICY "voice_samples_admin" ON public.voice_samples
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "voice_samples_read" ON public.voice_samples
  FOR SELECT USING (true);
