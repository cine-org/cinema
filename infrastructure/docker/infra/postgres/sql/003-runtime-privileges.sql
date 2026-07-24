\set ON_ERROR_STOP on

SELECT format(
  'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I',
  :'app_user'
)
\gexec

SELECT format(
  'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I',
  :'app_user'
)
\gexec

SELECT format(
  'REVOKE ALL ON TABLE public._prisma_migrations FROM %I',
  :'app_user'
)
WHERE to_regclass('public._prisma_migrations') IS NOT NULL
\gexec
