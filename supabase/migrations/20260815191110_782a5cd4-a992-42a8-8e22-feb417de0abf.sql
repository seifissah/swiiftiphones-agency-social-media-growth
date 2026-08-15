
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_customer_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_customer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;
