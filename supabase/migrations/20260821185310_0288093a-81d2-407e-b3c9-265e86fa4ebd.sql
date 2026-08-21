CREATE TABLE public.profile_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  changed_by uuid,
  field text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profile_change_log_profile_idx ON public.profile_change_log (profile_id, changed_at DESC);

GRANT SELECT ON public.profile_change_log TO authenticated;
GRANT ALL ON public.profile_change_log TO service_role;

ALTER TABLE public.profile_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile change log admin read"
  ON public.profile_change_log FOR SELECT TO authenticated
  USING (is_admin());

CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  f text;
  oldv text;
  newv text;
BEGIN
  FOREACH f IN ARRAY ARRAY['full_name','username','email','phone','company_name','bio','avatar_url','status'] LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', f, f)
      INTO oldv, newv USING OLD, NEW;
    IF oldv IS DISTINCT FROM newv THEN
      INSERT INTO public.profile_change_log (profile_id, changed_by, field, old_value, new_value)
      VALUES (NEW.id, auth.uid(), f, oldv, newv);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_profile_changes_trg
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();