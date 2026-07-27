\set ON_ERROR_STOP on

SELECT format(
  'ALTER %s %I.%I OWNER TO %I',
  CASE relation.relkind
    WHEN 'r' THEN 'TABLE'
    WHEN 'p' THEN 'TABLE'
    WHEN 'v' THEN 'VIEW'
    WHEN 'm' THEN 'MATERIALIZED VIEW'
    WHEN 'S' THEN 'SEQUENCE'
  END,
  namespace.nspname,
  relation.relname,
  :'migrator_user'
)
FROM pg_catalog.pg_class AS relation
INNER JOIN pg_catalog.pg_namespace AS namespace
  ON namespace.oid = relation.relnamespace
WHERE
  namespace.nspname = 'public'
  AND relation.relkind IN ('r', 'p', 'v', 'm', 'S')
  AND pg_get_userbyid(relation.relowner) <> :'migrator_user'
ORDER BY relation.relkind, relation.relname
\gexec

SELECT format(
  'ALTER TYPE %I.%I OWNER TO %I',
  namespace.nspname,
  type_definition.typname,
  :'migrator_user'
)
FROM pg_catalog.pg_type AS type_definition
INNER JOIN pg_catalog.pg_namespace AS namespace
  ON namespace.oid = type_definition.typnamespace
WHERE
  namespace.nspname = 'public'
  AND type_definition.typtype IN ('c', 'e')
  AND type_definition.typrelid = 0
  AND pg_get_userbyid(type_definition.typowner) <> :'migrator_user'
ORDER BY type_definition.typname
\gexec

SELECT format(
  'ALTER DOMAIN %I.%I OWNER TO %I',
  namespace.nspname,
  type_definition.typname,
  :'migrator_user'
)
FROM pg_catalog.pg_type AS type_definition
INNER JOIN pg_catalog.pg_namespace AS namespace
  ON namespace.oid = type_definition.typnamespace
WHERE
  namespace.nspname = 'public'
  AND type_definition.typtype = 'd'
  AND pg_get_userbyid(type_definition.typowner) <> :'migrator_user'
ORDER BY type_definition.typname
\gexec
