# Historical SQL scripts — no new migration in v2.1.0

The Tools Catalogue v2.1.0 upgrade contains **frontend/logic/test changes only**.

- `01_catalogue_only_upgrade_v2.sql`: base v2 migration for a deployment still on Page 3 v1. **Do not rerun** automatically if v2 is already operational. Verify live functions/triggers/permissions first.
- `02_optional_dev_anon_permissions.sql`: grants DEVELOPMENT-ONLY anonymous permissions, not appropriate for production.
- `01_tools_catalogue_drafts_and_release.sql`: **obsolete v1 SQL, retained for historical reference only; DO NOT RUN**. It creates an old question-materialization design that conflicts with v2.
- `02_development_anon_grants_ONLY.sql`: **obsolete v1 development grants; DO NOT RUN**.

Do not treat the presence of a SQL script in the archive as an instruction to run it.
