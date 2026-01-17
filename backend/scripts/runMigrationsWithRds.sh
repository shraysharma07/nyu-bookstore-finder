#!/bin/bash
# Run migrations using the actual RDS endpoint we found

set -e

echo "=== Database Migration Script (Using RDS Endpoint) ==="
echo ""

# RDS connection details (from AWS)
DB_HOST="bookmap-db.c3w2600mw0bt.eu-west-1.rds.amazonaws.com"
DB_PORT="5432"
DB_USER="bookmap"
DB_NAME="nyu_book_finder"  # Default, check if different

# Get password - try from EB env first, then prompt
DB_PASS=$(eb printenv 2>/dev/null | grep -i "DB_PASS\|RDS_PASS\|DATABASE_PASS" | cut -d'=' -f2- | tr -d ' "\"' | head -1)

if [ -z "$DB_PASS" ]; then
  # Try common default (from docs)
  echo "Password not found in EB env vars."
  echo "Trying default password..."
  DB_PASS="bookmap123"
  
  # Test connection with default
  export PGPASSWORD="$DB_PASS"
  export PGSSLMODE="require"
  
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Connection successful with default password"
  else
    echo "Default password didn't work."
    echo ""
    read -sp "Enter RDS password: " DB_PASS
    echo ""
  fi
fi

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
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Connection successful!"
  echo ""
elif psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Connected to postgres database (will create $DB_NAME if needed)"
  echo ""
else
  echo "✗ Connection failed"
  echo ""
  echo "Please check:"
  echo "  1. RDS security group allows connections from your IP"
  echo "  2. Password is correct"
  echo "  3. Database name is correct (trying: $DB_NAME)"
  exit 1
fi

# Check if database exists, create if not
echo "Checking if database '$DB_NAME' exists..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo "Database '$DB_NAME' doesn't exist. Creating..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;" || {
    echo "Failed to create database. It might already exist or you don't have permissions."
    echo "Trying to connect anyway..."
  }
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
echo ""
echo "To update EB DATABASE_URL, run:"
echo "  eb setenv DATABASE_URL=\"postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require\""
