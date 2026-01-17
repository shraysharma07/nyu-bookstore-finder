#!/bin/bash
# backend/scripts/runMigrations.sh
# Robust database migration runner - works locally and on EB
# Supports both DATABASE_URL and individual env vars

set -e

echo "=== Database Migration Runner ==="
echo ""

# Function to find SQL file
find_sql_file() {
  local filename="$1"
  local search_dirs=(
    "."
    "./backend"
    "./database"
    "./backend/database"
    "/var/app/current"
    "/var/app/current/backend"
    "/var/app/current/database"
  )
  
  for dir in "${search_dirs[@]}"; do
    if [ -f "$dir/$filename" ]; then
      echo "$dir/$filename"
      return 0
    fi
  done
  
  # Try find as last resort
  local found=$(find . -maxdepth 4 -type f -name "$filename" 2>/dev/null | head -1)
  if [ -n "$found" ]; then
    echo "$found"
    return 0
  fi
  
  return 1
}

# Parse connection details
DB_HOST=""
DB_PORT="5432"
DB_USER=""
DB_PASS=""
DB_NAME=""

if [ -n "$DATABASE_URL" ]; then
  echo "Using DATABASE_URL..."
  # Remove query params for parsing
  DB_URL="${DATABASE_URL%%\?*}"
  DB_URL=$(echo "$DB_URL" | xargs)  # Trim whitespace
  
  # Extract components with proper trimming
  DB_USER=$(echo "$DB_URL" | sed -n 's|.*postgres://\([^:]*\):.*|\1|p' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  DB_PASS=$(echo "$DB_URL" | sed -n 's|.*postgres://[^:]*:\([^@]*\)@.*|\1|p' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  DB_HOST=$(echo "$DB_URL" | sed -n 's|.*postgres://[^@]*@\([^:]*\):.*|\1|p' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  DB_PORT=$(echo "$DB_URL" | sed -n 's|.*postgres://[^@]*@[^:]*:\([^/]*\)/.*|\1|p' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  DB_NAME=$(echo "$DB_URL" | sed -n 's|.*postgres://[^/]*/\([^?]*\).*|\1|p' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  
  # Extract sslmode from query string
  if [[ "$DATABASE_URL" == *"sslmode="* ]]; then
    SSL_MODE=$(echo "$DATABASE_URL" | sed -n 's/.*[?&]sslmode=\([^&]*\).*/\1/p' | tr '[:upper:]' '[:lower:]')
    export PGSSLMODE="${SSL_MODE:-require}"
  else
    export PGSSLMODE="require"
  fi
elif [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
  echo "Using individual DB environment variables..."
  DB_HOST=$(echo "$DB_HOST" | xargs)
  DB_PORT="${DB_PORT:-5432}"
  DB_USER=$(echo "$DB_USER" | xargs)
  DB_PASS=$(echo "$DB_PASSWORD" | xargs)
  DB_NAME=$(echo "${DB_NAME:-nyu_book_finder}" | xargs)
  export PGSSLMODE="${PGSSLMODE:-require}"
else
  echo "ERROR: No database connection information found"
  echo ""
  echo "Set either:"
  echo "  DATABASE_URL='postgres://user:pass@host:port/dbname?sslmode=require'"
  echo "Or:"
  echo "  DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (and optionally DB_PORT, PGSSLMODE)"
  exit 1
fi

# Validate all required fields
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "host" ] || [ -z "$DB_USER" ] || [ "$DB_USER" = "user" ] || [ -z "$DB_PASS" ] || [ -z "$DB_NAME" ] || [ "$DB_NAME" = "dbname" ]; then
  echo "ERROR: Invalid connection details detected (contains placeholder values)"
  echo ""
  echo "Extracted values:"
  echo "  Host: '$DB_HOST'"
  echo "  Port: '$DB_PORT'"
  echo "  User: '$DB_USER'"
  echo "  Database: '$DB_NAME'"
  echo ""
  echo "Please check your DATABASE_URL or individual env vars"
  exit 1
fi

# Set password for psql
export PGPASSWORD="$DB_PASS"

echo "Connection details (safe preview):"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  SSL Mode: $PGSSLMODE"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "ERROR: psql is not installed"
  echo ""
  echo "Install it with:"
  echo "  brew install postgresql  # macOS"
  echo "  sudo yum install -y postgresql15  # Amazon Linux 2"
  echo "  sudo apt-get install -y postgresql-client  # Ubuntu"
  exit 1
fi

# Test connection
echo "Testing connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Connection successful!"
  echo ""
else
  echo "✗ Connection failed"
  echo ""
  echo "Attempting connection with verbose output..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" 2>&1 || true
  echo ""
  echo "Please check:"
  echo "  1. Host, port, username, password are correct"
  echo "  2. RDS security group allows connections from this IP/instance"
  echo "  3. Database exists or you have permission to create it"
  exit 1
fi

# Check/create database
echo "Checking database '$DB_NAME'..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo "Creating database '$DB_NAME'..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;" || {
    echo "WARNING: Failed to create database (might already exist or no permissions)"
  }
fi

echo ""
echo "Finding migration SQL files..."
echo ""

# Find migration files
MIGRATION_RDS=$(find_sql_file "database-rds.sql")
MIGRATION_NORMALIZED=$(find_sql_file "database-migration-code-normalized.sql")
MIGRATION_VARCHAR=$(find_sql_file "database-migration-varchar128.sql")

if [ -z "$MIGRATION_RDS" ]; then
  echo "ERROR: Could not find database-rds.sql"
  echo "Searched in: ./, ./backend, ./database, /var/app/current, etc."
  exit 1
fi

echo "Found migration files:"
echo "  Base schema: $MIGRATION_RDS"
[ -n "$MIGRATION_NORMALIZED" ] && echo "  Code normalized: $MIGRATION_NORMALIZED"
[ -n "$MIGRATION_VARCHAR" ] && echo "  Varchar128: $MIGRATION_VARCHAR"
echo ""

# Run migrations
echo "Running migrations..."
echo ""

# Migration 1: Base schema
echo "1. Running base schema ($MIGRATION_RDS)..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_RDS"; then
  echo "   ✓ Base schema completed"
else
  echo "   ✗ Base schema failed"
  exit 1
fi

# Migration 2: code_normalized (if exists)
if [ -n "$MIGRATION_NORMALIZED" ]; then
  echo ""
  echo "2. Running code_normalized migration ($MIGRATION_NORMALIZED)..."
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_NORMALIZED"; then
    echo "   ✓ Code normalized migration completed"
  else
    echo "   ✗ Code normalized migration failed"
    exit 1
  fi
fi

# Migration 3: varchar(128) (if exists)
if [ -n "$MIGRATION_VARCHAR" ]; then
  echo ""
  echo "3. Running varchar128 migration ($MIGRATION_VARCHAR)..."
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_VARCHAR"; then
    echo "   ✓ Varchar128 migration completed"
  else
    echo "   ✗ Varchar128 migration failed"
    exit 1
  fi
fi

echo ""
echo "=== All migrations completed successfully! ==="
echo ""
echo "Verifying..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" || true
echo ""
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as course_count FROM courses;" || true
