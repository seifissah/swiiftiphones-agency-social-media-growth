
CREATE TYPE public.app_role AS ENUM ('admin','customer');
CREATE TYPE public.account_status AS ENUM ('pending','active','rejected','suspended');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text,
  company_name text,
  bio text,
  avatar_url text,
  status public.account_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  is_demo boolean NOT NULL DEFAULT false,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text NOT NULL,
  profile_url text,
  connection_status text NOT NULL DEFAULT 'connected',
  data_source text NOT NULL DEFAULT 'manual',
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.social_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  recorded_on date NOT NULL DEFAULT current_date,
  followers integer NOT NULL DEFAULT 0,
  following integer NOT NULL DEFAULT 0,
  posts integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  engagement_rate numeric(6,2) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX social_metrics_account_date_idx ON public.social_metrics (social_account_id, recorded_on);

CREATE TABLE public.monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  summary text,
  recommendations text,
  admin_notes text,
  performance_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, month, year)
);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  metric text NOT NULL DEFAULT 'followers',
  starting_value integer NOT NULL DEFAULT 0,
  target_value integer NOT NULL DEFAULT 0,
  current_value integer NOT NULL DEFAULT 0,
  deadline date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  kind text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'admin_to_customer',
  subject text NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  admin_name text,
  action text NOT NULL,
  target_customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_customer_name text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  platform_name text NOT NULL DEFAULT 'Pulsegrid',
  auto_approve boolean NOT NULL DEFAULT false,
  show_rankings_to_customers boolean NOT NULL DEFAULT false,
  weight_growth integer NOT NULL DEFAULT 40,
  weight_engagement integer NOT NULL DEFAULT 30,
  weight_reach integer NOT NULL DEFAULT 20,
  weight_activity integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.platform_settings (id) VALUES (1);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.profiles, public.user_roles, public.social_accounts, public.social_metrics,
  public.monthly_reports, public.goals, public.notifications, public.messages,
  public.audit_logs, public.platform_settings TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE has_any boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_any;
  IF has_any THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
    ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET status = 'active' WHERE user_id = auth.uid();
  RETURN true;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "admin profile delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "roles self customer" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'customer');
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "accounts read" ON public.social_accounts FOR SELECT TO authenticated
  USING (public.is_admin() OR customer_id = public.current_customer_id());
CREATE POLICY "accounts admin write" ON public.social_accounts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "metrics read" ON public.social_metrics FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.social_accounts a WHERE a.id = social_account_id
      AND a.customer_id = public.current_customer_id()));
CREATE POLICY "metrics admin write" ON public.social_metrics FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "reports read" ON public.monthly_reports FOR SELECT TO authenticated
  USING (public.is_admin() OR customer_id = public.current_customer_id());
CREATE POLICY "reports admin write" ON public.monthly_reports FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "goals read" ON public.goals FOR SELECT TO authenticated
  USING (public.is_admin() OR customer_id = public.current_customer_id());
CREATE POLICY "goals admin write" ON public.goals FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "notifications read" ON public.notifications FOR SELECT TO authenticated
  USING (public.is_admin() OR customer_id = public.current_customer_id());
CREATE POLICY "notifications own update" ON public.notifications FOR UPDATE TO authenticated
  USING (public.is_admin() OR customer_id = public.current_customer_id())
  WITH CHECK (public.is_admin() OR customer_id = public.current_customer_id());
CREATE POLICY "notifications admin write" ON public.notifications FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "messages read" ON public.messages FOR SELECT TO authenticated
  USING (public.is_admin() OR customer_id = public.current_customer_id());
CREATE POLICY "messages own update" ON public.messages FOR UPDATE TO authenticated
  USING (public.is_admin() OR customer_id = public.current_customer_id())
  WITH CHECK (public.is_admin() OR customer_id = public.current_customer_id());
CREATE POLICY "messages customer insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (customer_id = public.current_customer_id() AND direction = 'customer_to_admin');
CREATE POLICY "messages admin write" ON public.messages FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "audit admin only" ON public.audit_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "settings read" ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings admin write" ON public.platform_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==== DEMO DATA (is_demo = true, safe to delete) ====
INSERT INTO public.profiles (id, full_name, username, email, phone, company_name, bio, status, is_demo, created_at, last_login) VALUES
 ('11111111-1111-1111-1111-111111111101','John Smith','johnsmith','john@brightlabs.io','+1 415 555 0101','Bright Labs','DTC skincare brand.','active',true, now() - interval '9 months', now() - interval '2 days'),
 ('11111111-1111-1111-1111-111111111102','Amara Okafor','amarao','amara@velvetco.com','+254 700 555 102','Velvet Co','Fashion & lifestyle.','active',true, now() - interval '7 months', now() - interval '1 day'),
 ('11111111-1111-1111-1111-111111111103','Liam Andersen','liama','liam@northpeak.co','+47 900 555 103','North Peak','Outdoor gear.','active',true, now() - interval '6 months', now() - interval '5 days'),
 ('11111111-1111-1111-1111-111111111104','Sofia Ramirez','sofiar','sofia@casaverde.mx','+52 55 555 0104','Casa Verde','Plant-based cafe chain.','active',true, now() - interval '5 months', now() - interval '3 days'),
 ('11111111-1111-1111-1111-111111111105','Dan Whitfield','danw','dan@ridgeaudio.com','+44 20 5550 105','Ridge Audio','Audio hardware.','pending',true, now() - interval '6 days', null),
 ('11111111-1111-1111-1111-111111111106','Mei Tanaka','meit','mei@studiomei.jp','+81 3 5550 106','Studio Mei','Design studio.','pending',true, now() - interval '2 days', null),
 ('11111111-1111-1111-1111-111111111107','Ethan Brooks','ethanb','ethan@loopfit.app','+1 212 555 0107','LoopFit','Fitness app.','suspended',true, now() - interval '8 months', now() - interval '40 days'),
 ('11111111-1111-1111-1111-111111111108','Nadia Farouk','nadiaf','nadia@aurumjewel.ae','+971 4 555 108','Aurum Jewel','Luxury jewellery.','rejected',true, now() - interval '20 days', null);

INSERT INTO public.social_accounts (id, customer_id, platform, handle, profile_url, data_source, last_synced_at) VALUES
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','instagram','@brightlabs','https://instagram.com/brightlabs','manual', now() - interval '1 day'),
 ('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101','tiktok','@brightlabs','https://tiktok.com/@brightlabs','manual', now() - interval '1 day'),
 ('22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111101','youtube','Bright Labs','https://youtube.com/@brightlabs','manual', now() - interval '3 days'),
 ('22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111102','instagram','@velvetco','https://instagram.com/velvetco','manual', now() - interval '2 days'),
 ('22222222-2222-2222-2222-222222222205','11111111-1111-1111-1111-111111111102','twitter','@velvetco','https://x.com/velvetco','manual', now() - interval '2 days'),
 ('22222222-2222-2222-2222-222222222206','11111111-1111-1111-1111-111111111103','instagram','@northpeakgear',null,'manual', now() - interval '4 days'),
 ('22222222-2222-2222-2222-222222222207','11111111-1111-1111-1111-111111111103','facebook','North Peak',null,'manual', now() - interval '4 days'),
 ('22222222-2222-2222-2222-222222222208','11111111-1111-1111-1111-111111111104','instagram','@casaverde',null,'manual', now() - interval '1 day'),
 ('22222222-2222-2222-2222-222222222209','11111111-1111-1111-1111-111111111104','tiktok','@casaverde',null,'manual', now() - interval '1 day'),
 ('22222222-2222-2222-2222-222222222210','11111111-1111-1111-1111-111111111107','instagram','@loopfit',null,'manual', now() - interval '35 days');

INSERT INTO public.social_metrics (social_account_id, recorded_on, followers, following, posts, likes, comments, shares, views, reach, impressions, engagement_rate)
SELECT a.id,
       (date_trunc('month', current_date) - ((11 - m) || ' months')::interval)::date,
       (a.base * (1 + (a.rate * m)))::int,
       (400 + m * 12)::int,
       (12 + m * 3)::int,
       (a.base * 0.09 * (1 + a.rate * m))::int,
       (a.base * 0.012 * (1 + a.rate * m))::int,
       (a.base * 0.004 * (1 + a.rate * m))::int,
       (a.base * 6.5 * (1 + a.rate * m))::int,
       (a.base * 11 * (1 + a.rate * m))::int,
       (a.base * 22 * (1 + a.rate * m))::int,
       round((4.2 + a.rate * m * 9)::numeric, 2)
FROM (VALUES
  ('22222222-2222-2222-2222-222222222201'::uuid, 8200, 0.052),
  ('22222222-2222-2222-2222-222222222202'::uuid, 5400, 0.081),
  ('22222222-2222-2222-2222-222222222203'::uuid, 3100, 0.037),
  ('22222222-2222-2222-2222-222222222204'::uuid, 15400, 0.041),
  ('22222222-2222-2222-2222-222222222205'::uuid, 4200, 0.022),
  ('22222222-2222-2222-2222-222222222206'::uuid, 9800, 0.063),
  ('22222222-2222-2222-2222-222222222207'::uuid, 6100, 0.011),
  ('22222222-2222-2222-2222-222222222208'::uuid, 12300, 0.074),
  ('22222222-2222-2222-2222-222222222209'::uuid, 21000, 0.096),
  ('22222222-2222-2222-2222-222222222210'::uuid, 7400, -0.014)
) AS a(id, base, rate)
CROSS JOIN generate_series(0, 11) AS m;

INSERT INTO public.monthly_reports (customer_id, month, year, summary, recommendations, performance_score, status, created_at) VALUES
 ('11111111-1111-1111-1111-111111111101', EXTRACT(month FROM current_date - interval '1 month')::int, EXTRACT(year FROM current_date - interval '1 month')::int,'Strong month driven by short-form video. Instagram and TikTok both accelerated.','Double down on Reels; test 3 posts/week on TikTok.',87,'sent', now() - interval '20 days'),
 ('11111111-1111-1111-1111-111111111102', EXTRACT(month FROM current_date - interval '1 month')::int, EXTRACT(year FROM current_date - interval '1 month')::int,'Steady growth with improved engagement on Instagram.','Increase carousel posts, reduce link-only tweets.',74,'sent', now() - interval '18 days'),
 ('11111111-1111-1111-1111-111111111103', EXTRACT(month FROM current_date)::int, EXTRACT(year FROM current_date)::int,'Draft in progress for the current period.','Pending review.',68,'draft', now() - interval '2 days'),
 ('11111111-1111-1111-1111-111111111104', EXTRACT(month FROM current_date - interval '1 month')::int, EXTRACT(year FROM current_date - interval '1 month')::int,'Best performing account in the portfolio this month.','Launch a UGC campaign to sustain momentum.',93,'sent', now() - interval '15 days');

INSERT INTO public.goals (customer_id, platform, metric, starting_value, target_value, current_value, deadline, status) VALUES
 ('11111111-1111-1111-1111-111111111101','instagram','followers',8200,20000,12400,'2026-12-31','active'),
 ('11111111-1111-1111-1111-111111111101','tiktok','followers',5400,15000,9700,'2026-12-31','active'),
 ('11111111-1111-1111-1111-111111111102','instagram','followers',15400,30000,21600,'2026-10-31','active'),
 ('11111111-1111-1111-1111-111111111104','tiktok','followers',21000,60000,43000,'2026-12-31','active');

INSERT INTO public.notifications (customer_id, title, message, kind) VALUES
 ('11111111-1111-1111-1111-111111111101','Your account was approved','Welcome aboard — your dashboard is now active.','success'),
 ('11111111-1111-1111-1111-111111111101','New monthly report available','Your latest social media report is ready to view.','info'),
 ('11111111-1111-1111-1111-111111111102','Social data updated','Instagram metrics were refreshed by your account manager.','info');

INSERT INTO public.messages (customer_id, subject, body, direction) VALUES
 ('11111111-1111-1111-1111-111111111101','August strategy call','Hi John — can we book 30 minutes this week to review the Reels plan?','admin_to_customer'),
 ('11111111-1111-1111-1111-111111111102','Content calendar','Sharing next month''s content calendar for your approval.','admin_to_customer');

INSERT INTO public.audit_logs (admin_name, action, target_customer_id, target_customer_name, details, created_at) VALUES
 ('System','Approved customer','11111111-1111-1111-1111-111111111101','John Smith','Status changed from pending to active', now() - interval '30 days'),
 ('System','Suspended customer','11111111-1111-1111-1111-111111111107','Ethan Brooks','Non-payment', now() - interval '10 days'),
 ('System','Generated monthly report','11111111-1111-1111-1111-111111111104','Sofia Ramirez','Report score 93', now() - interval '15 days');
