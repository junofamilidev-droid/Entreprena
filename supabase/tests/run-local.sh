#!/usr/bin/env bash
# Teste les migrations et les règles d'accès sur un PostgreSQL local jetable.
# Usage : PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/run-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=entreprena_test
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
psql -q -v ON_ERROR_STOP=1 -d $DB -f tests/supabase-stub.sql
for f in migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -d $DB -f "$f"; done
psql -q -v ON_ERROR_STOP=1 -d $DB -f tests/rls.sql
