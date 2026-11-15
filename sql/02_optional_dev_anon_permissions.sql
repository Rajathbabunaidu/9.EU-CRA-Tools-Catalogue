-- ONLY for an isolated Supabase DEVELOPMENT project WITHOUT Auth.
-- This allows any holder of the publishable key to manage the catalogue.
-- NEVER run this on a publicly available or production database.
-- Skip if existing v1 development permissions already allow the component to work.
BEGIN;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.cra_tm_tools, public.cra_tm_tool_releases,
    public.cra_tm_tool_drafts TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_create_catalogue_tool(text,text,text) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_save_catalogue_tool_draft(bigint,bigint,jsonb,text,text,text) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_release_catalogue_tool(bigint,bigint,text) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_start_catalogue_tool_version(bigint,text) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_set_catalogue_tool_active(bigint,boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.cra_tm_set_catalogue_release_active(bigint,boolean) TO anon;
COMMIT;
