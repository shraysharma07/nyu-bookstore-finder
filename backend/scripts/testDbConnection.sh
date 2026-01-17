#!/bin/bash
# Test database connection before running migrations

echo "=== Testing Database Connection ==="
echo ""

# Get DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set"
  echo "Run: export DATABASE_URL=\"\$(eb printenv | grep DATABASE_URL | cut -d'=' -f2- | tr -d '\\\"')\""
  exit 1
fi

echo "DATABASE_URL preview: ${DATABASE_URL%%@*}@..."
echo ""

# Parse connection string
# Format: postgres://user:password@host:port/database?sslmode=require
DB_URL="${DATABASE_URL%%\?*}"  # Remove query params

# Extract components
if [[ "$DB_URL" =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
  
  echo "Parsed connection details:"
  echo "  User: $DB_USER"
  echo "  Host: $DB_HOST"
  echo "  Port: $DB_PORT"
  echo "  Database: $DB_NAME"
  echo ""
  
  # Set SSL mode
  export PGSSLMODE="require"
  
  # Test connection using PGPASSWORD environment variable
  export PGPASSWORD="$DB_PASS"
  
  echo "Testing connection..."
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✓ Connection successful!"
    echo ""
    echo "You can now run migrations with:"
    echo "  psql -h \"$DB_HOST\" -p \"$DB_PORT\" -U \"$DB_USER\" -d \"$DB_NAME\" -f backend/database-rds.sql"
    exit 0
  else
    echo "✗ Connection failed"
    echo ""
    echo "Trying with connection string format..."
    # Try with connection string
    if psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
      echo "✓ Connection successful with connection string!"
      exit 0
    else
      echo "✗ Both methods failed"
      echo ""
      echo "Please check:"
      echo "  1. DATABASE_URL is correct"
      echo "  2. RDS security group allows connections from your IP"
      echo "  3. Database credentials are correct"
      exit 1
    fi
  fi
else
  echo "ERROR: Could not parse DATABASE_URL"
  echo "Expected format: postgres://user:password@host:port/database"
  echo "Got: ${DB_URL:0:50}..."
  exit 1
fi
