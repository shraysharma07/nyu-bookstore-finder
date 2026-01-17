#!/bin/bash
# backend/scripts/runMigrationsRobust.sh
# Robust database migration script that handles various DATABASE_URL formats

set -e

echo "=== Database Migration Script (Robust) ==="
echo ""

# Function to extract value from DATABASE_URL
extract_from_url() {
  local pattern="$1"
  echo "$DATABASE_URL" | sed -n "$pattern" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

# Get DATABASE_URL from EB
echo "Fetching DATABASE_URL from EB environment..."
DATABASE_URL_RAW=$(eb printenv 2>/dev/null | grep DATABASE_URL | head -1)

if [ -z "$DATABASE_URL_RAW" ]; then
  echo "ERROR: Could not find DATABASE_URL in EB environment"
  echo ""
  echo "Please set it manually:"
  echo "  export DATABASE_URL='postgres://user:pass@host:5432/dbname?sslmode=require'"
  exit 1
fi

# Extract the value (handle different formats)
if [[ "$DATABASE_URL_RAW" == *"="* ]]; then
  # Format: DATABASE_URL=value or DATABASE_URL = value
  DATABASE_URL=$(echo "$DATABASE_URL_RAW" | cut -d'=' -f2- | sed "s/^[[:space:]]*['\"]//;s/['\"][[:space:]]*$//" | xargs)
else
  DATABASE_URL="$DATABASE_URL_RAW"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgres://user:pass@host:5432/dbname" ]; then
  echo "ERROR: DATABASE_URL appears to contain placeholder values"
  echo "Got: ${DATABASE_URL:0:60}..."
  echo ""
  echo "Please check your EB environment variables:"
  echo "  eb printenv | grep DATABASE"
  echo ""
  echo "Or set it manually with actual RDS values:"
  echo "  export DATABASE_URL='postgres://actual-user:actual-pass@actual-host:5432/actual-db?sslmode=require'"
  exit 1
fi

echo "DATABASE_URL found (preview: ${DATABASE_URL%%@*}@...)"
echo ""

# Remove query parameters
DB_URL="${DATABASE_URL%%\?*}"
DB_URL=$(echo "$DB_URL" | xargs)  # Trim whitespace

# Try multiple parsing methods
echo "Parsing connection string..."

# Method 1: sed extraction
DB_USER=$(echo "$DB_URL" | sed -n 's|.*postgres://\([^:]*\):.*|\1|p' | xargs)
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*postgres://[^:]*:\([^@]*\)@.*|\1|p' | xargs)
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*postgres://[^@]*@\([^:]*\):.*|\1|p' | xargs)
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*postgres://[^@]*@[^:]*:\([^/]*\)/.*|\1|p' | xargs)
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*postgres://[^/]*/\([^?]*\).*|\1|p' | xargs)

# Method 2: If sed failed, try with postgresql:// prefix
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "host" ]; then
  DB_USER=$(echo "$DB_URL" | sed -n 's|.*postgresql://\([^:]*\):.*|\1|p' | xargs)
  DB_PASS=$(echo "$DB_URL" | sed -n 's|.*postgresql://[^:]*:\([^@]*\)@.*|\1|p' | xargs)
  DB_HOST=$(echo "$DB_URL" | sed -n 's|.*postgresql://[^@]*@\([^:]*\):.*|\1|p' | xargs)
  DB_PORT=$(echo "$DB_URL" | sed -n 's|.*postgresql://[^@]*@[^:]*:\([^/]*\)/.*|\1|p' | xargs)
  DB_NAME=$(echo "$DB_URL" | sed -n 's|.*postgresql://[^/]*/\([^?]*\).*|\1|p' | xargs)
fi

# Verify extraction
if [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$DB_HOST" ] || [ "$DB_HOST" = "host" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
  echo "ERROR: Could not parse DATABASE_URL"
  echo ""
  echo "Extracted values:"
  echo "  User: '$DB_USER'"
  echo "  Pass: '${DB_PASS:0:3}...' (hidden)"
  echo "  Host: '$DB_HOST'"
  echo "  Port: '$DB_PORT'"
  echo "  Database: '$DB_NAME'"
  echo ""
  echo "Full DATABASE_URL (first 100 chars): ${DATABASE_URL:0:100}..."
  echo ""
  echo "Please check:"
  echo "  1. DATABASE_URL format is: postgres://user:password@host:port/database"
  echo "  2. All values are actual (not placeholders like 'user', 'pass', 'host')"
  echo ""
  echo "You can set variables manually:"
  echo "  export DB_HOST='your-rds-endpoint.region.rds.amazonaws.com'"
  echo "  export DB_PORT='5432'"
  echo "  export DB_USER='your-username'"
  echo "  export DB_PASS='your-password'"
  echo "  export DB_NAME='your-database-name'"
  exit 1
fi

echo "Parsed connection:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Set SSL mode
export PGSSLMODE="require"

# Set password for psql (avoids interactive prompt)
export PGPASSWORD="$DB_PASS"

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

echo "Testing connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Connection successful!"
  echo ""
else
  echo "⚠️  Connection test failed, but continuing..."
  echo "   (This might be due to network restrictions)"
  echo ""
fi

echo "Running migrations..."
echo ""

# Migration 1: Base schema
echo "1. Running database-rds.sql..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f backend/database-rds.sql; then
  echo "   ✓ database-rds.sql completed"
else
  echo "   ✗ database-rds.sql failed"
  exit 1
fi

# Migration 2: code_normalized column
echo ""
echo "2. Running database-migration-code-normalized.sql..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f backend/database-migration-code-normalized.sql; then
  echo "   ✓ code_normalized migration completed"
else
  echo "   ✗ code_normalized migration failed"
  exit 1
fi

# Migration 3: varchar(128) for courses.code
echo ""
echo "3. Running database-migration-varchar128.sql..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f backend/database-migration-varchar128.sql; then
  echo "   ✓ varchar128 migration completed"
else
  echo "   ✗ varchar128 migration failed"
  exit 1
fi

echo ""
echo "=== All migrations completed successfully ==="
echo ""
echo "Verify with:"
echo "  psql -h \"$DB_HOST\" -p \"$DB_PORT\" -U \"$DB_USER\" -d \"$DB_NAME\" -c \"SELECT COUNT(*) FROM courses;\""
