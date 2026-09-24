-- Mirrors the cluster's cinema_ro; pg_read_all_data also covers tables later migrations add.
-- Applied by the postgres post_start hook on every start; safe to repeat.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cinema_ro') THEN
    CREATE ROLE cinema_ro LOGIN PASSWORD 'cinema_ro' IN ROLE pg_read_all_data;
  END IF;
END $$;
