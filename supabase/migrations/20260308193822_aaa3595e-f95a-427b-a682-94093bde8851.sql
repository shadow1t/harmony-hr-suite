
-- 1. Add advanced settings to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS social_insurance_pct numeric NOT NULL DEFAULT 9.75;

-- 2. Add expiry dates to employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS id_expiry_date date,
  ADD COLUMN IF NOT EXISTS contract_expiry_date date;

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid,
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    (user_id IS NULL AND company_id = get_user_company_id(auth.uid()))
    OR user_id = auth.uid()
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (user_id IS NULL AND company_id = get_user_company_id(auth.uid()))
  );

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
  );
