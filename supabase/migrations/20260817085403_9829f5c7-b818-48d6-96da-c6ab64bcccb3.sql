CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Trusted server-side (service_role) access has no auth.uid()
  IF auth.uid() IS NULL OR public.is_admin() THEN RETURN NEW; END IF;
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

CREATE OR REPLACE FUNCTION public.protect_message_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN RETURN NEW; END IF;
  NEW.id := OLD.id;
  NEW.sender_id := OLD.sender_id;
  NEW.customer_id := OLD.customer_id;
  NEW.direction := OLD.direction;
  NEW.subject := OLD.subject;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.protect_profile_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_message_columns() FROM PUBLIC, anon, authenticated;