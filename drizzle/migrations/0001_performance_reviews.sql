CREATE TABLE public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  score integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  verdict text NOT NULL DEFAULT 'auto',
  comment text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT performance_reviews_unique UNIQUE NULLS NOT DISTINCT (customer_id, social_account_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_reviews TO authenticated;
GRANT ALL ON public.performance_reviews TO service_role;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews admin write" ON public.performance_reviews FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "reviews read own" ON public.performance_reviews FOR SELECT TO authenticated USING (public.is_admin() OR customer_id = public.current_customer_id());