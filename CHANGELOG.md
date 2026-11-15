## v1.0.1 — WeWeb Vue template compilation fix (2026-11-15)

- Removed duplicate `:disabled` binding from the “+ Add option” button in `src/wwElement.vue`. Vue SFC compilation rejects duplicate attributes and can cause WeWeb import to fail.
- No changes to database SQL, RPCs, or application behavior.

# Changelog

## 1.0.0 — 2026-11-15

- First release of Page 3, one WeWeb Vue 3 coded component with Catalogue, Designer, Preview & Validation and Release Management.
- Added versioned immutable releases with editable JSONB working drafts and optimistic autosave.
- Added automatic materialization of released questionnaire content for new Template Builder attachments.
- Added read-only-by-default Supabase URL + publishable-key settings and development-only role grants.
