-- 1. Admin-only notes table
CREATE TABLE IF NOT EXISTS public.profile_admin_notes (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_admin_notes TO authenticated;
GRANT ALL ON public.profile_admin_notes TO service_role;
ALTER TABLE public.profile_admin_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile admin notes admin only" ON public.profile_admin_notes;
CREATE POLICY "profile admin notes admin only" ON public.profile_admin_notes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.profile_admin_notes (profile_id, notes)
SELECT id, admin_notes FROM public.profiles WHERE admin_notes IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS admin_notes;

-- 2. Protect privileged profile columns from non-admin writes
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending'::account_status;
    NEW.is_demo := false;
    NEW.user_id := auth.uid();
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.is_demo := OLD.is_demo;
  NEW.user_id := OLD.user_id;
  NEW.email := OLD.email;
  NEW.id := OLD.id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protect_profile_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_columns_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- 3. Customers may only flip the read flag on messages
CREATE OR REPLACE FUNCTION public.protect_message_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  NEW.id := OLD.id;
  NEW.sender_id := OLD.sender_id;
  NEW.customer_id := OLD.customer_id;
  NEW.direction := OLD.direction;
  NEW.subject := OLD.subject;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protect_message_columns_trg ON public.messages;
CREATE TRIGGER protect_message_columns_trg
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.protect_message_columns();

-- 4. Platform settings readable by admins only
DROP POLICY IF EXISTS "settings read" ON public.platform_settings;
CREATE POLICY "settings read" ON public.platform_settings
  FOR SELECT TO authenticated USING (public.is_admin());

-- 5. No self-service role assignment; roles handled by trusted server code
DROP POLICY IF EXISTS "roles self customer" ON public.user_roles;
DROP FUNCTION IF EXISTS public.bootstrap_admin();

-- 6. Lock down helper functions to authenticated policy evaluation only
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_customer_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.protect_profile_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_message_columns() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_customer_id() TO authenticated;