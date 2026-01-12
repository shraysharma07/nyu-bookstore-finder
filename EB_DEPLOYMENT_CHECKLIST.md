# Elastic Beanstalk Deployment Checklist

## Prerequisites
- AWS EB CLI installed and configured
- EB environment name (e.g., `nyu-bookstore-api`)
- RDS PostgreSQL database accessible from EB instance
- `DATABASE_URL` environment variable set in EB

## Step-by-Step: Deploy Database Schema to RDS

### 1. SSH into EB Instance
```bash
eb ssh
```

### 2. Navigate to Application Directory
Once inside the EB instance, find your application:
```bash
# Usually located in /var/app/current
cd /var/app/current

# Or if using a different structure:
cd /var/app/ondeck  # during deployment
```

### 3. Locate database.sql File
```bash
# The file should be in backend/database.sql or backend/database-rds.sql
ls -la backend/database*.sql
```

### 4. Install PostgreSQL Client (if not already installed)
```bash
# On Amazon Linux 2:
sudo yum install -y postgresql15

# Or on Ubuntu:
sudo apt-get update && sudo apt-get install -y postgresql-client
```

### 5. Run Database Schema

**Option A: Using database-rds.sql (Recommended - RDS-compatible)**
```bash
# Use the RDS-compatible version that handles existing tables gracefully
psql "$DATABASE_URL" -f backend/database-rds.sql
```

**Option B: Using original database.sql (if you need to create a new database)**
```bash
# First, extract connection details from DATABASE_URL
# Format: postgres://user:pass@host:port/dbname

# Connect to postgres database to create new database
psql "postgres://bookmap:bookmap123@bookmap-db.c3w2600mw0bt.eu-west-1.rds.amazonaws.com:5432/postgres" -c "CREATE DATABASE nyu_book_finder;"

# Then connect to new database and run schema
psql "postgres://bookmap:bookmap123@bookmap-db.c3w2600mw0bt.eu-west-1.rds.amazonaws.com:5432/nyu_book_finder" -f backend/database.sql
```

### 6. Verify Database Schema
```bash
# Connect and list tables
psql "$DATABASE_URL" -c "\dt"

# Check if key tables exist
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

# Verify some data was inserted
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM books;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM courses;"
```

### 7. Exit SSH
```bash
exit
```

## Deploy Code Changes

### 1. Commit Your Changes
```bash
git add .
git commit -m "Fix DB imports, add error logging, standardize auth middleware"
```

### 2. Deploy to EB
```bash
eb deploy
```

### 3. Monitor Deployment
```bash
# Watch logs during deployment
eb logs --stream

# Or check environment health
eb health
```

## Verify Deployment

### 1. Test Health Endpoint
```bash
# Get your EB URL
eb status

# Test health endpoint
curl https://your-eb-url.elasticbeanstalk.com/api/health
# Should return: {"ok":true}
```

### 2. Test Books Endpoint
```bash
# Test the course endpoint that was failing
curl "https://your-eb-url.elasticbeanstalk.com/api/books/course/TEST"

# Check server logs for detailed error messages
eb logs --all
```

### 3. Check Application Logs
```bash
# View recent logs
eb logs

# Filter for database errors
eb logs | grep -i "sql\|database\|error"
```

## Troubleshooting

### If Database Connection Fails
1. Verify `DATABASE_URL` is set correctly:
   ```bash
   eb printenv | grep DATABASE_URL
   ```

2. Test connection from EB instance:
   ```bash
   eb ssh
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

3. Check RDS security group allows EB instance IP/security group

### If Tables Don't Exist Error
1. Verify schema was applied:
   ```bash
   eb ssh
   psql "$DATABASE_URL" -c "\dt"
   ```

2. Re-run database-rds.sql (it's idempotent with IF NOT EXISTS)

### If Still Getting 500 Errors
1. Check detailed error logs:
   ```bash
   eb logs --all | grep -A 10 "Error\|error"
   ```

2. Look for SQL error codes in logs (e.g., `sqlError: 42P01` = relation does not exist)

3. Verify DATABASE_URL points to correct database:
   ```bash
   # Current DATABASE_URL points to 'postgres' database
   # If you created 'nyu_book_finder', update DATABASE_URL in EB environment
   eb setenv DATABASE_URL="postgres://bookmap:bookmap123@bookmap-db.c3w2600mw0bt.eu-west-1.rds.amazonaws.com:5432/nyu_book_finder"
   ```

## Quick Reference Commands

```bash
# Deploy
eb deploy

# SSH into instance
eb ssh

# View logs
eb logs --stream

# Check environment status
eb status

# View environment variables
eb printenv

# Set environment variable
eb setenv KEY=value

# Restart application
eb restart
```
