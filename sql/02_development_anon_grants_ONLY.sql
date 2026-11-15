-- OPTIONAL: isolated development only, for publishable-key browser access without Supabase Auth.
-- WARNING: grants anonymous clients catalogue WRITES. DO NOT run on a public/prod project.
-- Replace these with authenticated policies + restricted role grants before production.
BEGIN;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.cra_tm_tools,public.cra_tm_tool_releases,
 public.cra_tm_tool_drafts,public.cra_tm_question_types TO anon;
-- Deliberately no direct INSERT/UPDATE/DELETE table grants or sequence grants.
-- The restricted SECURITY DEFINER RPCs perform server-side validation.
GRANT EXECUTE ON FUNCTION public.cra_tm_create_catalogue_tool(text,text,text) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_save_catalogue_tool_draft(bigint,bigint,jsonb,text,text,text) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_release_catalogue_tool(bigint,bigint,text) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_start_catalogue_tool_version(bigint,text) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_set_catalogue_release_active(bigint,boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_set_catalogue_tool_active(bigint,boolean) TO anon;
COMMIT;
