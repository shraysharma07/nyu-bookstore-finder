#!/bin/bash
# Final migration script - uses actual RDS endpoint and prompts for password if needed

set -e

echo "=== Database Migration Script ==="
echo ""

# RDS connection details (from AWS)
DB_HOST="bookmap-db.c3w2600mw0bt.eu-west-1.rds.amazonaws.com"
DB_PORT="5432"
DB_USER="bookmap"
DB_NAME="nyu_book_finder"

echo "RDS Connection Details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Get password
if [ -z "$RDS_PASSWORD" ]; then
  read -sp "Enter RDS password for user '$DB_USER': " RDS_PASSWORD
  echo ""
fi

export PGPASSWORD="$RDS_PASSWORD"
export PGSSLMODE="require"

# Test connection
echo "Testing connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Connection successful!"
  echo ""
else
  echo "✗ Connection failed. Please check:"
  echo "  1. Password is correct"
  echo "  2. RDS security group allows connections from your IP"
  echo "  3. You're connected to VPN if required"
  exit 1
fi

# Check/create database
echo "Checking database '$DB_NAME'..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo "Creating database '$DB_NAME'..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;" || {
    echo "Note: Database might already exist or creation failed (continuing anyway)..."
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
echo "=== All migrations completed successfully! ==="
echo ""
echo "Next step: Update EB DATABASE_URL environment variable:"
echo ""
echo "  cd backend"
echo "  eb setenv DATABASE_URL=\"postgres://$DB_USER:$RDS_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require\""
echo ""
echo "Verify migration:"
echo "  psql -h \"$DB_HOST\" -p \"$DB_PORT\" -U \"$DB_USER\" -d \"$DB_NAME\" -c \"SELECT COUNT(*) FROM courses;\""
