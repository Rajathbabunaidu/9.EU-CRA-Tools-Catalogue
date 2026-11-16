# Authoritative catalogue ↔ Template Builder integration contract (v2.1.0)

## Source tables and ownership

- `cra_tm_tools`: registered tool identity (`tool_code`, `tool_name`, `tool_type`, `is_active`).
- `cra_tm_tool_drafts`: editable versioned catalogue metadata JSONB, optimistic revision and lock state.
- `cra_tm_tool_releases`: immutable published catalogue capability JSONB (`definition`), independently activatable.
- `cra_tm_tool_instances`: one tool attached to a particular contributor assessment. This is Page 2's instance, not a duplicate catalogue tool.
- `cra_tm_tool_sections` → `cra_tm_tool_questions` → `cra_tm_tool_answer_options`: Page 2 owns question/answer content, not Page 3.
- `cra_tm_question_types`: type metadata to be consumed by Page 2's dynamic Question Builder editor.
- `cra_tm_conditional_rules`, `cra_tm_conditional_rule_conditions`, `cra_tm_condition_answer_options`: conditional logic and option-ID mappings are Page 2 concerns.

## Supported release format

The new `schema_version:2`, `kind:'TOOL_CAPABILITY'`, `tool_type:'QUESTIONNAIRE'` catalogue release contains the selected `category`, `icon`, and capability flags, **not** sections, questions or answer options. See `src/logic.mjs` for the exact shape.

Legacy schema-v1 catalogue releases stay in history and may contain old embedded questionnaire content. They remain visible. **The v2 migration removes the future-attachment materialization trigger** so old embedded content is not copied into newly attached instances. Existing attached instances are not changed.

## Important limitation

Page 2's uploaded code uses active tool/release flags as the release selector. It currently does **not** apply Page 3's new semantic compatibility diagnostics. An active old release might therefore remain selectable in Page 2; choose a new compatible v2 release for new templates until Page 2 is upgraded.

## Current capabilities

- One supported engine: `QUESTIONNAIRE`.
- `CHECKLIST`, `SUPPORT_PERIOD`, evidence-only collector and calculators are future independent engine implementations. Do not mark them operational from catalogue metadata alone.
- Every instance's content and rules must remain independent across contributors.
- Tool release immutability and draft revision handling remain database-owned.

## Security

The component uses the Supabase public API with a `sb_publishable_` key. The isolated-development anonymous RPC grants in the old SQL are not suitable for production. Production must enforce authenticated team permissions, RLS or equivalent protected backend authorization, and historical record retention.
