#!/bin/bash
# Run migrations on EB instance where RDS security group allows connections
# Usage: Copy this to EB instance and run it there

set -e

echo "=== Database Migration Script (For EB Instance) ==="
echo ""

# RDS connection details
DB_HOST="bookmap-db.c3w2600mw0bt.eu-west-1.rds.amazonaws.com"
DB_PORT="5432"
DB_USER="bookmap"
DB_PASS="bookmap123"
DB_NAME="nyu_book_finder"

export PGPASSWORD="$DB_PASS"
export PGSSLMODE="require"

echo "Connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Test connection
echo "Testing connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Connection successful!"
  echo ""
else
  echo "✗ Connection failed"
  echo ""
  echo "Trying to get more details..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" 2>&1 || true
  exit 1
fi

# Check/create database
echo "Checking database '$DB_NAME'..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo "Creating database '$DB_NAME'..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;" || {
    echo "Note: Database might already exist (continuing anyway)..."
  }
fi

echo "Running migrations..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Try to find SQL files
if [ -f "$PROJECT_ROOT/backend/database-rds.sql" ]; then
  SQL_DIR="$PROJECT_ROOT/backend"
elif [ -f "/var/app/current/backend/database-rds.sql" ]; then
  SQL_DIR="/var/app/current/backend"
elif [ -f "./backend/database-rds.sql" ]; then
  SQL_DIR="./backend"
else
  echo "ERROR: Could not find database-rds.sql"
  echo "Searched in:"
  echo "  $PROJECT_ROOT/backend"
  echo "  /var/app/current/backend"
  echo "  ./backend"
  exit 1
fi

echo "Using SQL files from: $SQL_DIR"
echo ""

# Migration 1: Base schema
echo "1. Running database-rds.sql..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_DIR/database-rds.sql"; then
  echo "   ✓ database-rds.sql completed"
else
  echo "   ✗ database-rds.sql failed"
  exit 1
fi

# Migration 2: code_normalized column
if [ -f "$SQL_DIR/database-migration-code-normalized.sql" ]; then
  echo ""
  echo "2. Running database-migration-code-normalized.sql..."
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_DIR/database-migration-code-normalized.sql"; then
    echo "   ✓ code_normalized migration completed"
  else
    echo "   ✗ code_normalized migration failed"
    exit 1
  fi
fi

# Migration 3: varchar(128) for courses.code
if [ -f "$SQL_DIR/database-migration-varchar128.sql" ]; then
  echo ""
  echo "3. Running database-migration-varchar128.sql..."
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_DIR/database-migration-varchar128.sql"; then
    echo "   ✓ varchar128 migration completed"
  else
    echo "   ✗ varchar128 migration failed"
    exit 1
  fi
fi

echo ""
echo "=== All migrations completed successfully! ==="
echo ""
echo "Verify:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as course_count FROM courses;"
echo ""
echo "Update EB DATABASE_URL:"
echo "  eb setenv DATABASE_URL=\"postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require\""
