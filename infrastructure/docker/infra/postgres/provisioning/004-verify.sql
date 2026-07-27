\set ON_ERROR_STOP on

SELECT
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE
      rolname = :'app_user'
      AND rolcanlogin
      AND NOT rolsuper
      AND NOT rolcreatedb
      AND NOT rolcreaterole
      AND NOT rolreplication
      AND NOT rolbypassrls
  ) AS app_role_ok,
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE
      rolname = :'migrator_user'
      AND rolcanlogin
      AND NOT rolsuper
      AND NOT rolcreatedb
      AND NOT rolcreaterole
      AND NOT rolreplication
      AND NOT rolbypassrls
  ) AS migrator_role_ok,
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_database
    WHERE datname = :'database_name' AND pg_get_userbyid(datdba) = :'migrator_user'
  ) AS database_owner_ok,
  pg_get_userbyid(
    (
      SELECT nspowner
      FROM pg_catalog.pg_namespace
      WHERE nspname = 'public'
    )
  ) = :'migrator_user' AS schema_owner_ok,
  has_schema_privilege(:'app_user', 'public', 'USAGE')
    AND NOT has_schema_privilege(:'app_user', 'public', 'CREATE') AS app_schema_access_ok,
  NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS relation
    INNER JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = relation.relnamespace
    WHERE
      namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p', 'v', 'm', 'S')
      AND pg_get_userbyid(relation.relowner) <> :'migrator_user'
  ) AS object_owners_ok,
  NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS relation
    INNER JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = relation.relnamespace
    WHERE
      namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p')
      AND relation.relname <> '_prisma_migrations'
      AND (
        NOT has_table_privilege(:'app_user', relation.oid, 'SELECT')
        OR NOT has_table_privilege(:'app_user', relation.oid, 'INSERT')
        OR NOT has_table_privilege(:'app_user', relation.oid, 'UPDATE')
        OR NOT has_table_privilege(:'app_user', relation.oid, 'DELETE')
      )
  ) AS runtime_table_access_ok,
  to_regclass('public._prisma_migrations') IS NULL
    OR (
      NOT has_table_privilege(:'app_user', 'public._prisma_migrations', 'SELECT')
      AND NOT has_table_privilege(:'app_user', 'public._prisma_migrations', 'INSERT')
      AND NOT has_table_privilege(:'app_user', 'public._prisma_migrations', 'UPDATE')
      AND NOT has_table_privilege(:'app_user', 'public._prisma_migrations', 'DELETE')
    ) AS migration_table_private
\gset

\if :app_role_ok
\else
  \echo 'Verification failed: application role attributes are invalid'
  \quit 1
\endif

\if :migrator_role_ok
\else
  \echo 'Verification failed: migrator role attributes are invalid'
  \quit 1
\endif

\if :database_owner_ok
\else
  \echo 'Verification failed: migrator does not own the database'
  \quit 1
\endif

\if :schema_owner_ok
\else
  \echo 'Verification failed: migrator does not own the public schema'
  \quit 1
\endif

\if :app_schema_access_ok
\else
  \echo 'Verification failed: application schema privileges are invalid'
  \quit 1
\endif

\if :object_owners_ok
\else
  \echo 'Verification failed: public objects are not owned by the migrator'
  \quit 1
\endif

\if :runtime_table_access_ok
\else
  \echo 'Verification failed: runtime table privileges are incomplete'
  \quit 1
\endif

\if :migration_table_private
\else
  \echo 'Verification failed: application role can access _prisma_migrations'
  \quit 1
\endif
