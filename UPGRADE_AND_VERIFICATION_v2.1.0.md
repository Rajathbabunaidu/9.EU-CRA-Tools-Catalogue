# Tools Catalogue v2.1.0 — Upgrade & Verification

**Source baseline:** uploaded Page 3 Tools Catalogue v2.0.0 (15 Nov 2026).  
**Target:** existing WeWeb custom coded component, same GitHub repository and Supabase development project.  
**Scope:** source-only enhancement; no SQL migration and no changes to Page 2 Template Builder.

## Preserve first

1. Back up the current Page 3 repository, WeWeb component and Supabase test-project data before replacing files.
2. Preserve the existing Git repository, component name, Supabase URL and publishable-key settings.
3. Do **not** run any SQL from this package if v2.0.0 was already working. The packaged SQL is the historical v2 base upgrade only.
4. Do not place secret/service-role credentials into WeWeb or the repository. The supplied build's development-write mode is not authorized for production usage.

## Install

1. Extract the ZIP. Copy the source package files into the existing Page 3 component's local Git working directory, retaining that directory's `.git` and site-specific configuration.
2. Run `npm test` (requires Node.js 20+; no app dependencies required for these tests).
3. Commit/push changes using your normal review process.
4. Update/import the *same* Page 3 component in WeWeb, initially in an isolated test project.
5. Keep Page 2 Template Builder unchanged during this initial Page 3 installation.

## Manual acceptance in WeWeb + isolated Supabase

- [ ] Existing tools and their names, codes, statuses, release histories appear unchanged.
- [ ] Catalogue, Tool Profile, and Release Management tabs work with current horizontal/vertical layouts unchanged.
- [ ] A new Questionnaire tool receives its DB-generated stable code and an editable v1.0.0 draft.
- [ ] Metadata autosave works; deliberate invalid name is rejected; switching tools does not discard unsaved changes.
- [ ] Release an editable schema-v2 Questionnaire draft and verify it appears as `Compatible with Template Builder`.
- [ ] Active legacy v1 release remains visible, labelled `Legacy v1 definition`, and is NOT reported as v2-ready.
- [ ] Deactivate/activate a tool and release and verify the active-flag availability shown in the existing Template Builder; previously attached instances are untouched.
- [ ] `New Version` cannot open before the first release, cannot reuse a previous version, and cannot go backwards.
- [ ] Check that unanswered question configuration is NOT created in the catalogue; only Page 2 owns sections/questions/options.
- [ ] Verify no database objects, existing tool instances, published template snapshots or historical approvals changed as a result of deploying the component.

## Known scope boundaries

- Page 2 currently filters selection by active tool/release flags; it has **not yet been upgraded to enforce** the new v2 compatibility diagnostics. The diagnostics are informative, not an authorization or deployment guarantee.
- This does not implement Question Builder type-dependent option editing, deletion of domains/contributors/tool instances/review stages, or condition mappings. Those are the agreed **next Template Builder upgrade**.
- Only `QUESTIONNAIRE` is currently a functional tool engine. Checklist/Support Period/evidence collector require dedicated engines, configuration and persistence work before being marked ready.
- No WeWeb cloud build, live SQL tests or authenticated/RLS security validation were possible in this source-only environment. These must pass before production release.
