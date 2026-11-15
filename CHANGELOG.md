# Changelog

## 2.0.0 — 2026-11-15

- Rebuilt Page 3 as an app-store-style **catalogue-only** tool marketplace.
- Removed the questionnaire section editor, question designer, option editor, question hints and question preview from Page 3.
- Kept one Vue 3/WeWeb coded element with Catalogue, Tool Profile and Release Management internal views.
- Added automated, unique database-generated tool codes; no tool-code input field.
- Kept metadata auto-save with optimistic concurrency revisions.
- Updated release RPC to publish schema-v2 capability metadata without questionnaire content.
- Disabled the old future-attachment question materialization trigger; existing template content untouched.
- Added explicit legacy v1 draft conversion retaining old questionnaire data under `legacy_definition`.
- Kept immutable release definitions and activation/deactivation lifecycle.
- Maintained configurable project URL, publishable key and isolated-development write gating.
- Added nine focused source/API tests.

## 1.0.1 — 2026-11-15

- Corrected duplicate Vue attribute in the original questionnaire-designer component.

## 1.0.0 — 2026-11-15

- Original full questionnaire designer; superseded by the approved responsibility split.
