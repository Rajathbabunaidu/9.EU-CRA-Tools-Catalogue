-- nVent EU CRA Hub — Page 3 Catalogue-Only upgrade, v2.0.0
-- Run ONCE as the owner of the isolated Supabase DEVELOPMENT database.
-- This does not delete tools, drafts, releases, sections, questions, or instances.
-- It deactivates the old AFTER INSERT questionnaire-copy trigger for future attachments.
-- Full script must be executed, from BEGIN through COMMIT, with no text selected.
BEGIN;

DO $preflight$
BEGIN
    IF to_regclass('public.cra_tm_tools') IS NULL
       OR to_regclass('public.cra_tm_tool_releases') IS NULL
       OR to_regclass('public.cra_tm_tool_drafts') IS NULL
       OR to_regclass('public.cra_tm_tool_instances') IS NULL THEN
       RAISE EXCEPTION 'Tools Catalogue v1 schema is missing. Apply the existing SQL 01 first.';
    END IF;
END;
$preflight$;

-- The previous Page 3 model copied its question definitions on new template-tool attachment.
-- The approved v2 model keeps ALL questions and answer options inside Template Builder.
-- Existing tool instances and historical release definitions remain untouched.
DROP TRIGGER IF EXISTS trg_cra_tm_materialize_tool_release_on_attach
    ON public.cra_tm_tool_instances;

-- Reuse the existing RPC signature: tool code may now be NULL to generate it automatically.
-- Only QUESTIONNAIRE is currently backed by the existing Template Builder renderer.
CREATE OR REPLACE FUNCTION public.cra_tm_create_catalogue_tool(
    p_tool_code text,
    p_tool_name text,
    p_description text DEFAULT NULL
) RETURNS TABLE (tool_id bigint, draft_id bigint, revision bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $body$
DECLARE
    v_base text;
    v_code text;
    v_tool_id bigint;
    v_draft_id bigint;
    v_attempt integer;
BEGIN
    IF nullif(btrim(p_tool_name),'') IS NULL OR length(btrim(p_tool_name)) > 180 THEN
        RAISE EXCEPTION 'Tool name must be 1–180 characters';
    END IF;
    IF length(coalesce(p_description,'')) > 5000 THEN
        RAISE EXCEPTION 'Description is too long';
    END IF;
    IF nullif(btrim(coalesce(p_tool_code,'')),'') IS NOT NULL THEN
        v_base := upper(btrim(p_tool_code));
        IF v_base !~ '^[A-Z][A-Z0-9_]{1,79}$' THEN
            RAISE EXCEPTION 'Tool code must be 2–80 uppercase letters, digits or underscores';
        END IF;
    ELSE
        v_base := upper(regexp_replace(btrim(p_tool_name),'[^A-Za-z0-9]+','_','g'));
        v_base := trim(both '_' from v_base);
        IF v_base = '' THEN v_base := 'TOOL'; END IF;
        IF v_base !~ '^[A-Z]' THEN v_base := 'TOOL_'||v_base; END IF;
        v_base := rtrim(left(v_base,70),'_');
    END IF;

    -- Serialize conflicting name-generated codes to avoid concurrent duplicate races.
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('CRA_TOOL_CODE:'||v_base));
    FOR v_attempt IN 0..9999 LOOP
        v_code := CASE WHEN v_attempt=0 THEN v_base
                     ELSE left(v_base,74)||'_'||lpad(v_attempt::text,4,'0') END;
        IF NOT EXISTS (SELECT 1 FROM public.cra_tm_tools WHERE tool_code=v_code) THEN
            INSERT INTO public.cra_tm_tools (tool_code,tool_name,description,tool_type,is_active)
            VALUES (v_code,btrim(p_tool_name),nullif(btrim(coalesce(p_description,'')),''),
                    'QUESTIONNAIRE',true)
            RETURNING id INTO v_tool_id;
            EXIT;
        END IF;
    END LOOP;
    IF v_tool_id IS NULL THEN RAISE EXCEPTION 'Cannot generate a unique tool code'; END IF;

    INSERT INTO public.cra_tm_tool_drafts (tool_id,draft_version,definition)
    VALUES (v_tool_id,'1.0.0',
      '{"schema_version":2,"kind":"TOOL_CAPABILITY","tool_type":"QUESTIONNAIRE", "catalogue":{"category":"Assessment","icon":"clipboard-list"},"capabilities":{"template_question_builder":true,"supports_sections":true,"supports_questions":true,"supports_options":true,"supports_attachments":true,"supports_comments":true,"supports_conditional_rules":true,"supports_risk_issue_rules":true}}'::jsonb)
    RETURNING id INTO v_draft_id;
    RETURN QUERY SELECT v_tool_id,v_draft_id,1::bigint;
END;
$body$;

CREATE OR REPLACE FUNCTION public.cra_tm_save_catalogue_tool_draft(
    p_tool_id bigint,
    p_expected_revision bigint,
    p_definition jsonb,
    p_draft_version text,
    p_tool_name text,
    p_description text DEFAULT NULL
) RETURNS TABLE (draft_id bigint, revision bigint, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $body$
DECLARE
    v_id bigint;
    v_rev bigint;
    v_updated timestamptz;
    v_type text;
    v_category text;
    v_icon text;
BEGIN
    IF p_expected_revision IS NULL OR p_expected_revision < 1 THEN
        RAISE EXCEPTION 'Expected revision is required'; END IF;
    IF nullif(btrim(p_tool_name),'') IS NULL OR length(btrim(p_tool_name)) > 180 THEN
        RAISE EXCEPTION 'Tool name must be 1–180 characters'; END IF;
    IF length(coalesce(p_description,'')) > 5000 THEN
        RAISE EXCEPTION 'Description is too long'; END IF;
    IF p_draft_version IS NULL OR btrim(p_draft_version) !~ '^[0-9]+\.[0-9]+\.[0-9]+$' THEN
        RAISE EXCEPTION 'Version must be numeric semver'; END IF;
    IF jsonb_typeof(p_definition) <> 'object' OR p_definition->>'schema_version' <> '2'
        OR p_definition->>'kind' <> 'TOOL_CAPABILITY'
        OR jsonb_typeof(p_definition->'catalogue') <> 'object'
        OR jsonb_typeof(p_definition->'capabilities') <> 'object' THEN
        RAISE EXCEPTION 'Catalogue-only definition schema v2 is required'; END IF;
    v_category := p_definition#>>'{catalogue,category}';
    v_icon := p_definition#>>'{catalogue,icon}';
    IF coalesce(v_category,'') NOT IN ('Assessment','Compliance','Security','Operations') THEN
        RAISE EXCEPTION 'Unsupported catalogue category'; END IF;
    IF coalesce(v_icon,'') NOT IN ('clipboard-list','shield-check','list-checks','file-check-2') THEN
        RAISE EXCEPTION 'Unsupported catalogue icon'; END IF;
    IF length(p_definition::text) > 150000 THEN RAISE EXCEPTION 'Definition too large'; END IF;

    SELECT tool_type INTO v_type FROM public.cra_tm_tools WHERE id=p_tool_id FOR UPDATE;
    IF NOT FOUND OR v_type<>'QUESTIONNAIRE' THEN
        RAISE EXCEPTION 'This tool type has no implemented editor and renderer'; END IF;
    IF p_definition->>'tool_type' IS DISTINCT FROM v_type THEN
        RAISE EXCEPTION 'Catalogue definition does not match the registered tool type'; END IF;
    IF EXISTS (SELECT 1 FROM public.cra_tm_tool_releases
                WHERE tool_id=p_tool_id AND release_version=btrim(p_draft_version)) THEN
        RAISE EXCEPTION 'This version is already released'; END IF;

    UPDATE public.cra_tm_tool_drafts AS d
       SET definition=p_definition,draft_version=btrim(p_draft_version),
           revision=d.revision+1,updated_at=now()
     WHERE d.tool_id=p_tool_id AND d.revision=p_expected_revision AND d.is_locked=false
     RETURNING d.id,d.revision,d.updated_at INTO v_id,v_rev,v_updated;
    IF NOT FOUND THEN RAISE EXCEPTION 'Draft is locked or changed elsewhere. Refresh first.'; END IF;
    UPDATE public.cra_tm_tools SET tool_name=btrim(p_tool_name),
      description=nullif(btrim(coalesce(p_description,'')),''),updated_at=now()
    WHERE id=p_tool_id;
    RETURN QUERY SELECT v_id,v_rev,v_updated;
END;
$body$;

-- A catalogue release describes a tool capability, not questionnaire content.
CREATE OR REPLACE FUNCTION public.cra_tm_release_catalogue_tool(
    p_tool_id bigint,
    p_expected_revision bigint,
    p_release_notes text DEFAULT NULL
) RETURNS TABLE (release_id bigint, release_version text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $body$
DECLARE
    d public.cra_tm_tool_drafts%ROWTYPE;
    t public.cra_tm_tools%ROWTYPE;
    v_release_id bigint;
BEGIN
    SELECT * INTO d FROM public.cra_tm_tool_drafts WHERE tool_id=p_tool_id FOR UPDATE;
    IF NOT FOUND OR d.is_locked THEN RAISE EXCEPTION 'No editable draft exists'; END IF;
    IF d.revision IS DISTINCT FROM p_expected_revision THEN
        RAISE EXCEPTION 'Draft revision changed; refresh before release'; END IF;
    SELECT * INTO t FROM public.cra_tm_tools WHERE id=p_tool_id FOR UPDATE;
    IF NOT FOUND OR t.tool_type<>'QUESTIONNAIRE' THEN
        RAISE EXCEPTION 'Only tools with an implemented QUESTIONNAIRE renderer may be released'; END IF;
    IF NOT t.is_active THEN RAISE EXCEPTION 'Activate the tool before releasing'; END IF;
    IF d.definition->>'schema_version' IS DISTINCT FROM '2'
       OR d.definition->>'kind' IS DISTINCT FROM 'TOOL_CAPABILITY'
       OR d.definition->>'tool_type' IS DISTINCT FROM t.tool_type THEN
        RAISE EXCEPTION 'Convert the legacy questionnaire draft to a catalogue-only draft first'; END IF;
    IF EXISTS(SELECT 1 FROM public.cra_tm_tool_releases
              WHERE tool_id=p_tool_id AND release_version=d.draft_version) THEN
        RAISE EXCEPTION 'This release version already exists'; END IF;
    INSERT INTO public.cra_tm_tool_releases
      (tool_id,release_version,release_notes,definition,is_active)
    VALUES (p_tool_id,d.draft_version,nullif(btrim(coalesce(p_release_notes,'')),''),
            d.definition,true)
    RETURNING id INTO v_release_id;
    UPDATE public.cra_tm_tool_drafts SET is_locked=true,
      revision=revision+1,updated_at=now() WHERE id=d.id;
    RETURN QUERY SELECT v_release_id,d.draft_version;
END;
$body$;

CREATE OR REPLACE FUNCTION public.cra_tm_start_catalogue_tool_version(
    p_tool_id bigint,
    p_next_version text
) RETURNS TABLE (draft_id bigint, revision bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $body$
DECLARE
    d public.cra_tm_tool_drafts%ROWTYPE;
    v_definition jsonb;
    v_id bigint;
    v_revision bigint;
    v_has_draft boolean := false;
BEGIN
    IF p_next_version IS NULL OR btrim(p_next_version) !~ '^[0-9]+\.[0-9]+\.[0-9]+$' THEN
        RAISE EXCEPTION 'Next version must use numeric semver'; END IF;
    PERFORM 1 FROM public.cra_tm_tools
       WHERE id=p_tool_id AND tool_type='QUESTIONNAIRE' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Tool not found or renderer unsupported'; END IF;
    IF EXISTS (SELECT 1 FROM public.cra_tm_tool_releases
         WHERE tool_id=p_tool_id AND release_version=btrim(p_next_version)) THEN
        RAISE EXCEPTION 'Version already exists'; END IF;
    SELECT * INTO d FROM public.cra_tm_tool_drafts WHERE tool_id=p_tool_id FOR UPDATE;
    v_has_draft := FOUND;
    IF v_has_draft AND NOT d.is_locked THEN
        RAISE EXCEPTION 'Finish the current draft before starting a new version'; END IF;

    SELECT r.definition INTO v_definition
    FROM public.cra_tm_tool_releases r WHERE r.tool_id=p_tool_id
    ORDER BY r.created_at DESC,r.id DESC LIMIT 1;
    IF v_definition IS NULL THEN RAISE EXCEPTION 'No previous release to version'; END IF;
    IF v_definition->>'schema_version' IS DISTINCT FROM '2' THEN
        -- Keep historical definition in archive; do not migrate historical questionnaire content.
        v_definition := jsonb_build_object(
          'schema_version',2,'kind','TOOL_CAPABILITY','tool_type','QUESTIONNAIRE',
          'catalogue',jsonb_build_object('category','Assessment','icon','clipboard-list'),
          'capabilities',jsonb_build_object('template_question_builder',true,
             'supports_sections',true,'supports_questions',true,'supports_options',true,
             'supports_attachments',true,'supports_comments',true,
             'supports_conditional_rules',true,'supports_risk_issue_rules',true),
          'legacy_definition',v_definition);
    END IF;
    IF v_has_draft THEN
        UPDATE public.cra_tm_tool_drafts dr
           SET draft_version=btrim(p_next_version),definition=v_definition,
               revision=dr.revision+1,is_locked=false,updated_at=now()
         WHERE dr.id=d.id RETURNING dr.id,dr.revision INTO v_id,v_revision;
    ELSE
        INSERT INTO public.cra_tm_tool_drafts AS dr(tool_id,draft_version,definition)
          VALUES(p_tool_id,btrim(p_next_version),v_definition)
        RETURNING dr.id,dr.revision INTO v_id,v_revision;
    END IF;
    RETURN QUERY SELECT v_id,v_revision;
END;
$body$;

-- Preserve the old v1 function and data for audit; only its trigger is removed.
-- No privileged RPC is granted to PUBLIC. Existing development role grants are preserved.
REVOKE ALL ON FUNCTION public.cra_tm_create_catalogue_tool(text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cra_tm_save_catalogue_tool_draft(bigint,bigint,jsonb,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cra_tm_release_catalogue_tool(bigint,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cra_tm_start_catalogue_tool_version(bigint,text) FROM PUBLIC;

COMMIT;
