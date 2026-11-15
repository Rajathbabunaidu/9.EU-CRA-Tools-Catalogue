# Page 3 ↔ Page 2 integration contract

## Runtime path

1. Page 3 `cra_tm_create_catalogue_tool(text,text,text)` creates a `cra_tm_tools` record and editable draft `cra_tm_tool_drafts` automatically. `p_tool_code=null` generates unique stable uppercase code in the database.
2. Page 3 `cra_tm_save_catalogue_tool_draft(...)` persists catalogue metadata with revision checking; the draft contains a v2 `TOOL_CAPABILITY` definition with **zero** question/section content.
3. Page 3 `cra_tm_release_catalogue_tool(...)` publishes an immutable `cra_tm_tool_releases` record with `is_active=true`. A valid draft no longer needs any questions.
4. Page 2 loads `cra_tm_tools` and `cra_tm_tool_releases` and displays releases where BOTH the tool and release have `is_active=true`.
5. Page 2 `cra_tm_save_tool_instance(...)` creates an instance belonging to a contributor. The former `trg_cra_tm_materialize_tool_release_on_attach` trigger is removed, so the instance starts **empty**.
6. Page 2 owns `cra_tm_tool_sections` → `cra_tm_tool_questions` → `cra_tm_tool_answer_options`, with its existing save RPCs. Same template can use the same capability across different contributors, with independent configurations.
7. Rules and review-stage configuration remain in Page 2. Existing templates and historical tool instances are left untouched.

## RPC signatures reused (no frontend signature changes)

```text
cra_tm_create_catalogue_tool(text,text,text)
cra_tm_save_catalogue_tool_draft(bigint,bigint,jsonb,text,text,text)
cra_tm_release_catalogue_tool(bigint,bigint,text)
cra_tm_start_catalogue_tool_version(bigint,text)
cra_tm_set_catalogue_tool_active(bigint,boolean)
cra_tm_set_catalogue_release_active(bigint,boolean)
```

## Existing release guard

`cra_tm_protect_tool_release()` rejects changes to `id`, `tool_id`, `release_version`, `definition`, `created_at`, but permits changing `is_active` and `updated_at`. The included SQL does not replace the guard.

## Existing v1 migration side effects addressed

`sql/01_catalogue_only_upgrade_v2.sql` drops the **trigger** `trg_cra_tm_materialize_tool_release_on_attach` from `cra_tm_tool_instances` but leaves the former function definition in place for legacy audit. It does not change any existing tool instances or their content. No backfill.

## Limitations not concealed

- Page 2's category-specific rendering currently supports QUESTIONNAIRE configuration and question-based controls. Dedicated checklist and evidence-collection engines are intentionally marked planned, not clickable.
- Released v1 definitions may contain old sections/questions inside JSON, but are no longer automatically copied to NEW tool instances; old attached instances remain untouched.
- Page 2 still needs independent frontend enhancement for a richer designer, but already has section/question/option modals and existing save RPCs. That later work is separate.
- The deployed component must have correct `anon` grants (dev only); PostgreSQL permission failures are not fixed by changing the publishable key.
- Page 2's template publication/review integration is out of scope for this Page 3 upgrade.
