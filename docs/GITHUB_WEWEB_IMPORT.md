# Existing GitHub / WeWeb component upgrade (Page 3 v2.1.0)

This is an **upgrade of the same Tools Catalogue component**. Do not create another Tools page, repository or WeWeb component unless your engineering deployment process explicitly requires a separate test environment.

1. Back up your current existing Page 3 Git repository and current WeWeb component revision.
2. Extract the v2.1.0 release ZIP and copy its files into the EXISTING Page 3 Git working directory. Keep your `.git`, repository remote and site-specific settings. Never commit Supabase keys.
3. In that directory, run `npm test` with Node 20+ and review the diff.
4. Commit, push to your approved branch, then import/update the same coded component under WeWeb → Coded Components. Activate the new version only in a test project first.
5. On Page 3 keep the same component properties: Supabase Project URL, publishable key, initial tool ID and accent color. Enable development writes only for the isolated development database.
6. Follow `UPGRADE_AND_VERIFICATION_v2.1.0.md` for the acceptance checklist. Test Page 2 release visibility before approving the upgrade.

**Database:** No new SQL for v2.1.0 when v2.0.0 is already operational. Do not run the previous v1 draft/materialization SQL. If upgrading from v1, follow `README.md` and carefully verify the original v2 base upgrade migration status first.

**Security:** Production needs Supabase Auth, RLS and function-level authorization; `sb_publishable_` alone does not authorize data modification. Do not enable anonymous writes publicly.
