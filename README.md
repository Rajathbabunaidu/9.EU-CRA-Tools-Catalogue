# nVent EU CRA Hub — Page 3: Reusable Tools Catalogue

**v1.0.0 · WeWeb coded element · Vue 3 · Supabase PostgreSQL**

One WeWeb page, **one parent coded component**, with four internal views: Tool Catalogue, Tool Designer, Preview & Validation and Release Management. This is a separate Page 3 element and does **not** replace the existing Page 2 Template Builder.

## Included features

| Feature | Implementation |
|---|---|
| Tool registration | **+ New Tool** registers the tool and its initial v1.0.0 draft in Supabase atomically. No separate Register button. |
| Tool catalogue | Live search/filter, tool identity and lifecycle, active/inactive states. |
| Tool Designer | Tool metadata; ordered sections; ordered questions; dynamically loaded question types; option labels/values/hints; required/enable, attachment and comment settings. |
| Draft persistence | Auto-save (950-ms debounce) in PostgreSQL, with optimistic revision checking and Saving/Saved/Error indication. No separate Save Tool button. |
| Preview | Local response simulator; no assessment or submission records are created. |
| Validation | Checks section/question names, codes, question types, options, at least one active question. Rechecked inside the release RPC. |
| Release | Atomic server-side validation followed by an immutable `cra_tm_tool_releases` row. |
| Versioning | Create next draft from previous definition without altering previous releases. |
| Template Builder integration | On **new** tool-instance assignment, an AFTER INSERT trigger copies released sections/questions/options to existing Template Builder tables. No Page 2 component edit is needed for this operation. |

**Scope:** This version creates `QUESTIONNAIRE` tools only. Other tool types require corresponding design/execution support; merely adding a row with another `tool_type` is not enough. Risk/conditional rules remain managed in the existing Template Builder. The preview is not the runtime assessment engine.

## Repository layout

```text
nvent-eu-cra-tools-catalogue/
├── package.json
├── ww-config.js
├── src/
│   ├── wwElement.vue        # One parent component, all views
│   ├── api.mjs              # PostgREST + RPC adapter
│   └── logic.mjs            # Definition schema, validation, ordering
├── sql/
│   ├── 01_tools_catalogue_drafts_and_release.sql
│   └── 02_development_anon_grants_ONLY.sql
├── docs/
│   ├── DATABASE_AND_INTEGRATION.md
│   └── GITHUB_WEWEB_IMPORT.md
└── tests/
    └── tool-catalogue.test.mjs
```

## Installation (do this in order)

### 1. Apply **SQL 01** in your Supabase **development** SQL Editor

Run the entire file `sql/01_tools_catalogue_drafts_and_release.sql` once. It is wrapped in `BEGIN; ... COMMIT;` and is additive. It creates:

- **one** new table `cra_tm_tool_drafts` (drafts cannot be stored in existing immutable releases);
- six restricted SQL functions to create, auto-save, release, version and activate/deactivate tools/releases;
- one trigger function + AFTER INSERT trigger to copy **released questionnaire content** into a newly attached tool instance.

It does **not** drop your existing review tables or alter released definitions. It does not backfill old tool instances.

### 2. Apply **SQL 02 only for isolated no-Auth development**

The user's current workflow uses the Supabase publishable key **without a signed-in Supabase user**. In this situation, requests use the `anon` role. Run `sql/02_development_anon_grants_ONLY.sql` to grant read access to the four catalogue tables and execution of the six restricted development RPCs. No direct INSERT/UPDATE/DELETE table access is granted to `anon` by this SQL.

**Important:** Even with server-side validation, granting unauthenticated users access to these create/release RPCs is **not safe for production**. Do not expose a write-enabled dev Supabase project publicly. Before production, implement Supabase Auth, authorized roles and RLS, and revoke `anon` EXECUTE permissions on write RPCs. Never put `sb_secret_`, service-role keys or database passwords in browser properties.

### 3. Push this repository to GitHub

Extract the ZIP and put the **contents** of `nvent-eu-cra-tools-catalogue` at the root of a *new* GitHub repository. Commands are in `docs/GITHUB_WEWEB_IMPORT.md`. Do not add `.env` credentials.

### 4. Import into WeWeb

WeWeb workspace Dashboard → Coded components → Import element → select your GitHub repo and `main` branch → set imported version active. Drag **EU CRA Hub — Tools Catalogue** onto **Page 3 — Tools**.

In WeWeb component properties configure:

- **Supabase Project URL:** `https://<your-project>.supabase.co`
- **Supabase Publishable Key:** `sb_publishable_…`
- **Allow development write operations:** `ON` only in private, isolated development.
- Initial Tool ID: optional.

The component uses direct HTTPS PostgREST requests with `apikey` header. No Supabase service role or custom WeWeb backend plugin is required.

### 5. Try one tool (not an extended test cycle)

Click + New Tool → enter name/code → Designer → Add Section → Add Question → select a populated question type → add answer options if applicable → Preview & Validation → Release Management → Release Tool. In Template Builder, refresh Page 2 and choose **+ Add tool from catalogue**: the active release should appear. On new attachment its content is materialized to Template Builder section/question/option tables.

If the question-type dropdown is empty, the existing `cra_tm_question_types` reference table has no active rows; configure those reference records before creating a questionnaire. This package does not overwrite customer-defined question types.

### 6. Existing Template Builder permissions

Page 2 uses its own RPCs, such as `cra_tm_save_tool_instance`. If Page 2 receives `permission denied for function...` or for a table when attaching a tool, that's a **Page 2 anon permission gap**, not failure of this Tool Catalogue. Add only the required Page 2 role grants after examining the exact error. Do not broadly grant the entire `public` schema to `anon`.

## Current verification status

- Source is aligned to the **uploaded 2026-11-15 backend schema** and the existing Page 2 WeWeb package.
- The catalogue tool/release/draft RPC contracts and materialization trigger are provided in SQL, **but have not been run against your live Supabase instance**.
- JavaScript unit checks pass; the Vue script syntax and markup were checked locally.
- **Full WeWeb CLI compilation, live browser use and server-side SQL execution are not yet verified.** The GitHub import/build and your private development Supabase connection are the first live integration check.

## References

- WeWeb coded elements: https://developer.weweb.io/component-anatomy.html
- WeWeb GitHub import: https://developer.weweb.io/using-llms-to-generate-custom-coded-comps/using-claude-code.html
- Supabase publishable-key guidelines: https://supabase.com/docs/guides/getting-started/api-keys


### v1.0.1 import fix
The initial v1.0.0 contained a duplicate `:disabled` attribute on the Add option button. This is corrected in v1.0.1. Push to GitHub `main`, then return to WeWeb Coded components and import/update the latest version.
