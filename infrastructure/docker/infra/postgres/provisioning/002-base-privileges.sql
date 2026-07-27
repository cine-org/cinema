\set ON_ERROR_STOP on

SELECT format('ALTER DATABASE %I OWNER TO %I', :'database_name', :'migrator_user')
\gexec

SELECT format('ALTER SCHEMA public OWNER TO %I', :'migrator_user')
\gexec

SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', :'database_name')
\gexec

SELECT format(
  'GRANT CONNECT ON DATABASE %I TO %I, %I',
  :'database_name',
  :'app_user',
  :'migrator_user'
)
\gexec

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'app_user')
\gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
  :'migrator_user',
  :'app_user'
)
\gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
  :'migrator_user',
  :'app_user'
)
\gexec
