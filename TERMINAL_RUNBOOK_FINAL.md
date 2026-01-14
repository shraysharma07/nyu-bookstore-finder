# Terminal Runbook: Production Deployment & Verification

## Prerequisites
- Backend deployed to EB: `bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`
- Frontend deployed to Amplify (auto-deploys on git push)
- Database: RDS Postgres with `DATABASE_URL` set in EB environment

## Step 1: Verify Current Backend Status

```bash
# Check health
curl http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health

# Expected: {"ok":true}
```

## Step 2: Apply Database Migration (if code_normalized column doesn't exist)

```bash
cd backend
eb ssh

# Once in EB instance:
cd /var/app/current
psql "$DATABASE_URL" -f database-migration-code-normalized.sql

# Verify column exists:
psql "$DATABASE_URL" -c "\d+ courses" | grep -i "code_normalized"

# Exit SSH
exit
```

**Expected:** Migration completes without errors, `code_normalized` column visible.

## Step 3: Reset and Import Catalog (if database is empty)

```bash
cd backend
eb ssh

# Once in EB instance:
cd /var/app/current

# Copy CSV to instance (if not already there)
# Or upload via S3/SCP first, then:
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM courses;"

# If count is 0, reset and import:
# First, ensure CSV is available at /tmp/course_catalog.csv (or adjust path)
# Then run:
npm run catalog:reset -- --file /tmp/course_catalog.csv

# Or if CSV is in repo:
npm run catalog:reset -- --file database/seed/course_catalog.csv

# Verify import:
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM courses;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM books;"

exit
```

**Expected:** Courses and books imported, counts > 0.

## Step 4: Set Frontend Environment Variable (Amplify Console)

1. Go to AWS Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Add:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`
   - **Important**: Use `http://` NOT `https://` (HTTPS not enabled on EB)
5. Save and redeploy

**OR** via AWS CLI:
```bash
# Get app ID first
aws amplify list-apps

# Set env var (replace APP_ID with your Amplify app ID)
aws amplify update-app --app-id YOUR_APP_ID --environment-variables REACT_APP_API_URL=http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com

# Trigger redeploy
aws amplify start-job --app-id YOUR_APP_ID --branch-name main --job-type RELEASE
```

## Step 5: Verify Backend Endpoints

```bash
# Test health
curl http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health

# Test students/search (Format 1: with name)
curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/students/search \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","dorm":"Chamberi","course":"WREX-UF 9101"}' \
  --max-time 2 -w "\nTime: %{time_total}s\nHTTP: %{http_code}\n"

# Test students/search (Format 2: without name, with professor)
curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/students/search \
  -H "Content-Type: application/json" \
  -d '{"dorm":"Chamberi","course":"WREX-UF 9101","professor":"Weubben"}' \
  --max-time 2 -w "\nTime: %{time_total}s\nHTTP: %{http_code}\n"

# Expected:
# - Time: <1 second
# - HTTP: 200 (or 400/503 if no data, but NOT 500)
# - Response contains "requiredBooks" array (and "books" alias)
```

## Step 6: Test Admin Login

```bash
# Replace with your actual admin credentials from EB env vars
export ADMIN_USERNAME="your-admin-username"
export ADMIN_PASSWORD="your-admin-password"

curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}"

# Expected: {"ok":true,"token":"..."} or {"ok":false,"error":"invalid_credentials"}
```

## Step 7: Run Smoke Tests Locally

```bash
cd backend

# Set env vars
export API_BASE_URL=http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com
export ADMIN_USERNAME="your-admin-username"
export ADMIN_PASSWORD="your-admin-password"

# Run tests
node scripts/smokeTests.js

# Expected: All tests pass
```

## Step 8: Run Smoke Tests on EB

```bash
cd backend
eb ssh

# Once in EB instance:
cd /var/app/current/backend
API_BASE_URL=http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com \
ADMIN_USERNAME="your-admin-username" \
ADMIN_PASSWORD="your-admin-password" \
node scripts/smokeTests.js

exit
```

## Step 9: Verify Frontend in Browser

1. Open your Amplify frontend URL
2. Go to "Find My Books" page
3. Fill in form:
   - Name: (optional, defaults to "Student")
   - Dorm: Select one (e.g., "Chamberi")
   - Class Type: Select one
   - Teacher: Select one
   - Class: Select one
4. Click "Find My Books"
5. **Expected:**
   - Spinner shows briefly (<2 seconds)
   - Results page loads with books
   - No infinite loading
   - If error: user-friendly message displayed

## Step 10: Verify Admin Login in Browser

1. Open your Amplify frontend URL
2. Navigate to `/login`
3. Enter admin credentials
4. Click "Sign In"
5. **Expected:**
   - Redirects to `/admin` dashboard
   - No errors

## Troubleshooting

### Backend returns 503 "Database connection failed"
- Check `DATABASE_URL` is set in EB environment variables
- Verify RDS security group allows EB security group
- Check RDS is running: `aws rds describe-db-instances`

### Frontend shows "Unable to connect to server"
- Verify `REACT_APP_API_URL` is set in Amplify (use `http://` not `https://`)
- Check CORS allows Amplify origin
- Verify backend health endpoint works

### "Find My Books" infinite spinner
- Check browser console for errors
- Verify API response includes `requiredBooks` or `books`
- Check network tab: request should complete in <2 seconds

### Admin login fails
- Verify `JWT_SECRET` is set in EB environment
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set (or admin exists in DB)
- Check backend logs: `eb logs`

### Catalog shows old data
- Verify catalog was reset and re-imported
- Check database: `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM courses;"`
- Re-run catalog import if needed
