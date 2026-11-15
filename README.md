# nVent EU CRA Hub — Page 3 Tools Catalogue

**v2.0.0 · One WeWeb Vue 3 coded element · Supabase PostgreSQL · Catalogue-only redesign**

This package replaces the **Page 3** Tools Catalogue. It does **not** replace Page 2 Template Builder and does **not** store questionnaire sections, questions, options, hints or rules in Page 3.

## Final approved responsibility split

| Page 3 — Tools Catalogue | Page 2 — Template Builder |
|---|---|
| Catalogue of registered, versioned tool capabilities | Select an eligible active release under a contributor |
| Create tool; generate unique stable code automatically | Create and configure an independent `cra_tm_tool_instances` record |
| Tool name, category, icon, description, lifecycle | Create sections, questions, answer options, descriptions, hints |
| Create editable draft; automatic metadata save | Configure attachment/comment settings, conditional and risk rules |
| Release capability version; activate/deactivate tools and releases | Preview, validate and publish the configured assessment template |

**Currently implemented tool engine: `QUESTIONNAIRE` only.** A dedicated checklist or evidence-collection engine must be implemented in the assessment editor/renderer before those types can be registered and released. The visual catalogue labels those as planned, not functional.

## Supabase contract, inspected from supplied schema

Existing tables:
- `public.cra_tm_tools`: `id`, `tool_code`, `tool_name`, `description`, `tool_type`, `is_active`, audit dates.
- `public.cra_tm_tool_releases`: `id`, `tool_id`, `release_version`, `release_notes`, `definition` JSONB, `is_active`, audit dates. Existing `cra_tm_protect_tool_release()` keeps identity/definition immutable; release activity is adjustable.
- `public.cra_tm_tool_drafts`: created by the **previous Page 3 SQL 01** and already applied in the user's development project. One draft per tool, with optimistic `revision` and `is_locked`.
- `public.cra_tm_tool_instances`: Page 2 attachment. Content is configured under existing `cra_tm_tool_sections`, `cra_tm_tool_questions`, `cra_tm_tool_answer_options`.

The new catalogue release definition is metadata only:

```json
{
  "schema_version": 2,
  "kind": "TOOL_CAPABILITY",
  "tool_type": "QUESTIONNAIRE",
  "catalogue": { "category": "Assessment", "icon": "clipboard-list" },
  "capabilities": {
    "template_question_builder": true,
    "supports_sections": true,
    "supports_questions": true,
    "supports_options": true,
    "supports_attachments": true,
    "supports_comments": true,
    "supports_conditional_rules": true,
    "supports_risk_issue_rules": true
  }
}
```

No questionnaire questions or sections are authored on Page 3. A new tool instance starts empty and is configured inside Page 2.

## IMPORTANT: deployment sequence

**1. Run `sql/01_catalogue_only_upgrade_v2.sql` in the same Supabase DEVELOPMENT project used by Pages 2 and 3.** Run the ENTIRE script from `BEGIN;` to `COMMIT;` with no SQL text selected. This updates four existing catalogue RPC functions, makes generated tool codes automatic, permits releasing metadata-only tools without questions, and **drops the old AFTER INSERT question-materialization trigger**. It does not delete existing data or released versions. The prior immutable release constraint remains in effect.

**2. Permissions:** If previous Tools Catalogue SQL 02 development grants are already present, you normally **do not need to repeat them**. If you encounter an RPC permission error, run `sql/02_optional_dev_anon_permissions.sql` **only for your isolated no-auth development project**. It grants anonymous catalogue reads and write RPC execution. Never use this arrangement on a publicly accessible production project.

**3. Update the EXISTING GitHub Page 3 repository:** Extract this ZIP and copy the files from its folder into your existing local `9.EU CRA Tools Catalogue` working directory, **preserving `.git`**. Then in PowerShell:

```powershell
cd "$env:USERPROFILE\Downloads\CRA-Action Hub\weweb-components\9.EU CRA Tools Catalogue"
git add .
git commit -m "Redesign Page 3 as catalogue-only tools marketplace v2.0.0"
git push origin main
```

You do not need to create a new GitHub repository. In WeWeb → Coded Components, update/import the latest commit of the existing repository and set the successful version active.

**4. Configure the imported component's properties** on Page 3:
- `Supabase Project URL`: `https://<project-ref>.supabase.co`
- `Supabase Publishable Key`: `sb_publishable_...`
- `Allow development writes`: ON only in a private isolated dev project, OFF for read-only usage.
- `Initial Tool ID`: optional.

No service-role key or `sb_secret_...` key should be placed in a browser component or GitHub repository. The REST adapter uses HTTPS `/rest/v1/` with the `apikey` header. No JWT Bearer header is added for the publishable key.

**5. One focused verification (not a full test cycle):** Open Page 3 → select your existing `Product Security Questionnaire` tool → if it has an **old v1 designer draft**, click **Convert draft**. This safely archives the old draft JSON under `legacy_definition`. Go to **Release Management → Release Tool**. Return to Page 2, refresh, attach the active release to a contributor, and configure sections/questions there.

## Existing records are preserved

- No previous tools, releases, draft rows, contributor assignments, template instances, sections, questions, or options are deleted.
- Old `schema_version: 1` releases stay in the database and visible as **Legacy v1 definition**; their old question data is not copied to NEW tool instances after this upgrade. Existing tool instances retain their own content.
- An editable v1 draft can be converted explicitly. The old content is retained inside its new draft JSON under `legacy_definition` for reference; it is not converted into active questionnaire content.
- A released catalogue definition is immutable. Modify the tool by creating the next draft version; edits only affect that future release.

## Development checks and limitations

- JavaScript unit tests and API adapter tests: `npm test`.
- JS script and attribute/markup checks are done during packaging.
- The WeWeb cloud build and live PostgreSQL execution **cannot be verified from this offline source package**; deploy to your private project before treating this as fully integrated.
- Permission issues with Page 2's separate RPCs (for example `cra_tm_save_tool_instance`) must be resolved in Page 2's own development permissions; the Page 3 package does not grant those privileges.
- Authentication/RLS/role authorization are required for production. A publishable key is not user authorization.

## Files

```text
├─ src/
│  ├─ wwElement.vue                  # single parent Vue component; catalogue, profile, releases
│  ├─ api.mjs                        # Supabase PostgREST adapter
│  └─ logic.mjs                      # release metadata and versioning
├─ sql/
│  ├─ 01_catalogue_only_upgrade_v2.sql
│  └─ 02_optional_dev_anon_permissions.sql
├─ tests/catalogue.test.mjs
├─ docs/INTEGRATION_AND_UPGRADE.md
├─ ww-config.js
├─ package.json
├─ CHANGELOG.md
└─ README.md
```

## References

- [WeWeb custom coded component anatomy](https://developer.weweb.io/component-anatomy.html)
- [Supabase publishable-key guidance](https://supabase.com/docs/guides/getting-started/api-keys)
