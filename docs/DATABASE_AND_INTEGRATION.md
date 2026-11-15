# Catalogue-to-Template Builder backend contract

## Existing tables (as inspected from uploaded 2026-11-15 schema)

- `cra_tm_tools`: `tool_code` unique, `tool_name`, `tool_type`, `is_active`.
- `cra_tm_tool_releases`: `(tool_id,release_version)` unique; JSONB `definition`; `is_active`. The existing `cra_tm_protect_tool_release()` trigger **rejects updates to a released definition**.
- `cra_tm_question_types`: catalogue of active `type_code`, `supports_options`, `supports_multiple_values`.
- `cra_tm_tool_instances`: assigned to a contributor via `cra_tm_save_tool_instance(...)` and references `tool_release_id`.
- `cra_tm_tool_sections`: linked to tool instances, not directly to catalogue tools.
- `cra_tm_tool_questions`: linked to sections, requires valid `question_type`.
- `cra_tm_tool_answer_options`: linked to questions.

## Additive table

`cra_tm_tool_drafts`: `tool_id` UNIQUE FK, `draft_version`, `definition JSONB`, `revision` (optimistic concurrency), `is_locked`, timestamps. Only the **unreleased** draft changes. The released definition is stored as a new, immutable row in `cra_tm_tool_releases`.

## RPCs

| RPC | Purpose |
|---|---|
| `cra_tm_create_catalogue_tool` | Atomic new catalogue tool + initial draft |
| `cra_tm_save_catalogue_tool_draft` | Auto-save metadata and definition, expected revision required |
| `cra_tm_release_catalogue_tool` | Server validate + insert immutable release + lock draft |
| `cra_tm_start_catalogue_tool_version` | Open editable next version from last release |
| `cra_tm_set_catalogue_release_active` | Enable/disable release availability |
| `cra_tm_set_catalogue_tool_active` | Enable/disable whole tool |

## Released JSONB definition format

```json
{
  "schema_version": 1,
  "sections": [
    {
      "client_id": "stable-editor-id",
      "section_name": "Secure Design",
      "description": "Review the design controls",
      "display_order": 0,
      "is_enabled": true,
      "configuration": {},
      "questions": [
        {
          "client_id": "stable-question-id",
          "question_code": "Q_1",
          "question_text": "Is access controlled?",
          "friendly_name": "Access control",
          "description": "Evidence instructions",
          "question_hint": "Describe the security mechanism",
          "question_type": "<existing cra_tm_question_types.type_code>",
          "display_order": 0,
          "is_required": true,
          "is_enabled": true,
          "allows_attachment": true,
          "allows_comment": true,
          "configuration": {},
          "validation_rules": {},
          "options": []
        }
      ]
    }
  ]
}
```

For option-capable types, `options` contains objects with `client_id, option_value, option_label, option_hint, display_order, is_default, is_enabled, configuration`.

## Automatic materialization to Page 2

The new `trg_cra_tm_materialize_tool_release_on_attach` runs **AFTER INSERT** on `cra_tm_tool_instances`. For a `QUESTIONNAIRE` whose release contains `schema_version=1`, it inserts the corresponding section/question/answer-option records into the existing Template Builder tables. The original template version DRAFT guards still run. The materialization is in the *same Postgres transaction* as attaching the tool instance: if it fails, the whole insertion rolls back.

No retroactive backfill: tool instances created **before** the trigger will not be changed automatically. Legacy releases with undefined `schema_version` are not materialized (their old workflows remain unchanged).

## Security

New RPCs use `SECURITY DEFINER` with an empty search path and explicit `public.` names. The migration revokes general `PUBLIC` execute. The optional development-only grant file explicitly gives the `anon` role access to specific read tables and RPCs. **This is not production authorization.** Future production design must implement Supabase Auth, identity-scoped role checks in privileged functions, RLS policies, and remove anonymous write RPC grants.

## Known constraints

- The Tool Designer only implements questionnaire tool types; other tool types need a corresponding editor and renderer.
- Draft-level conditional and risk rules are not embedded in the reusable definition; Template Builder continues to manage them per instance.
- For existing Page 2 code, only new tool instances get materialized. The backend cannot guarantee already-existing instances receive the new content unless a separate, audited migration is created.
- There is no automatic live release smoke test in this package. The provided SQL must be applied by the user in their Supabase project.
