# Terminal Commander Runbook - Production Fix & Verification

This runbook provides exact copy/paste commands to diagnose, fix, and verify production issues.

## Prerequisites

- AWS EB CLI installed and configured (`eb --version`)
- Access to EB environment: `bookmap-api-dev`
- Access to RDS Postgres database
- Admin credentials for testing

---

## PHASE 1: Local Inspection & Verification

### 1.1 Check Current Code State

```bash
cd /Users/shray/nyu-bookstore-finder
git status
git log --oneline -5
```

**Expected:** Shows modified files and recent commits  
**If wrong:** Ensure you're in the correct directory and have latest code

### 1.2 Verify CSV File Exists

```bash
ls -lh database/seed/course_catalog.csv
head -3 database/seed/course_catalog.csv
```

**Expected:** File exists, shows CSV header with columns  
**If wrong:** Run: `node -e "const fs = require('fs'); const content = fs.readFileSync('frontend/src/course_catalogue.js', 'utf8'); const match = content.match(/export const csvData = \`([\s\S]*?)\`;/); if (match) { fs.writeFileSync('database/seed/course_catalog.csv', match[1]); console.log('✓ CSV extracted'); }"`

### 1.3 Test Import Script Locally (Dry Run)

```bash
cd backend
npm run catalog:import -- --file ../database/seed/course_catalog.csv
```

**Expected:** Script runs and shows import summary  
**If wrong:** Check that `DATABASE_URL` is set in `.env` and database is accessible

### 1.4 Run Smoke Tests Locally

```bash
cd backend
API_BASE_URL=http://localhost:5000 npm run smoke:prod
```

**Expected:** All tests pass (or at least health checks pass)  
**If wrong:** Ensure backend is running locally (`npm start`)

---

## PHASE 2: EB Environment Inspection

### 2.1 Check EB Environment Status

```bash
cd backend
eb status
```

**Expected:** Status: Ready, Health: Green  
**If wrong:** Check EB console for deployment issues

### 2.2 Inspect EB Logs (Recent Errors)

```bash
cd backend
eb logs --all | tail -100 | grep -E "error|Error|ERROR|CORS|failed" | head -20
```

**Expected:** No critical errors, or shows specific error messages  
**If wrong:** Note the error and check corresponding code section

### 2.3 Check Environment Variables

```bash
cd backend
eb printenv | grep -E "DATABASE_URL|CORS_ALLOWED_ORIGINS|JWT_SECRET|NODE_ENV|ADMIN"
```

**Expected:** All required vars are set:
- `DATABASE_URL` (Postgres connection string)
- `CORS_ALLOWED_ORIGINS` (Amplify frontend URL)
- `JWT_SECRET` (non-empty)
- `NODE_ENV=production`
- `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (or `ADMIN_PASSWORD`)

**If wrong:** Set missing vars:
```bash
eb setenv DATABASE_URL="postgres://..." CORS_ALLOWED_ORIGINS="https://main.d327192gluqcs1.amplifyapp.com" JWT_SECRET="your-secret" NODE_ENV="production" ADMIN_USERNAME="your-username" ADMIN_PASSWORD_HASH="bcrypt-hash"
```

### 2.4 SSH into EB Instance

```bash
cd backend
eb ssh
```

**Expected:** You're now in the EB instance shell  
**If wrong:** Run `eb ssh --setup` first to configure SSH

### 2.5 Check Application Files on EB

```bash
# Inside EB SSH session
cd /var/app/current
pwd
ls -la backend/
ls -la database/seed/ 2>/dev/null || echo "Seed directory not found"
```

**Expected:** Application files are present  
**If wrong:** Files may not be deployed yet - proceed with deployment

### 2.6 Check Node Process Status

```bash
# Inside EB SSH session
ps aux | grep node
pm2 list 2>/dev/null || systemctl status nodejs 2>/dev/null || echo "Check process manager"
```

**Expected:** Node process is running  
**If wrong:** Check logs: `tail -50 /var/log/eb-engine.log`

### 2.7 Exit EB SSH

```bash
exit
```

---

## PHASE 3: Database Verification

### 3.1 Connect to Database (via EB SSH)

```bash
cd backend
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM courses;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM books;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM course_books;"
```

**Expected:** Shows current row counts  
**If wrong:** Database connection issue - verify `DATABASE_URL`

### 3.2 Check for Old Data

```bash
# Inside EB SSH session
psql "$DATABASE_URL" -c "SELECT code, name FROM courses LIMIT 5;"
psql "$DATABASE_URL" -c "SELECT title, author FROM books LIMIT 5;"
```

**Expected:** Shows current catalog data  
**If wrong:** Data may be empty or outdated - proceed with import

### 3.3 Verify Schema

```bash
# Inside EB SSH session
psql "$DATABASE_URL" -c "\d courses"
psql "$DATABASE_URL" -c "\d books"
psql "$DATABASE_URL" -c "\d course_books"
```

**Expected:** Tables exist with correct columns  
**If wrong:** Run schema: `psql "$DATABASE_URL" -f backend/database-rds.sql`

---

## PHASE 4: Run Catalog Import on EB

### 4.1 Copy CSV to EB Instance (if not already there)

```bash
cd backend
eb ssh
cd /var/app/current

# Check if CSV exists
ls -lh database/seed/course_catalog.csv

# If not, you'll need to upload it or it should be in the deployment
```

**Expected:** CSV file exists at `database/seed/course_catalog.csv`  
**If wrong:** The CSV should be in the repo and deployed automatically

### 4.2 Run Import on EB

```bash
# Inside EB SSH session
cd /var/app/current/backend
npm run catalog:import -- --file ../database/seed/course_catalog.csv
```

**Expected:** Import completes with summary showing:
- `coursesCreated: X`
- `booksCreated: Y`
- `relationshipsCreated: Z`
- `errors: []`

**If wrong:**
- Check database connection: `echo $DATABASE_URL`
- Check file path: `ls -lh ../database/seed/course_catalog.csv`
- Check logs for SQL errors

### 4.3 Verify Import Results

```bash
# Inside EB SSH session
psql "$DATABASE_URL" -c "SELECT COUNT(*) as course_count FROM courses;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as book_count FROM books;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as relationship_count FROM course_books;"
psql "$DATABASE_URL" -c "SELECT code, name FROM courses WHERE code LIKE 'SPAN-UA%' LIMIT 5;"
```

**Expected:** 
- Course count > 0 (should match CSV rows)
- Book count > 0
- Relationship count > 0
- Shows expected courses like "SPAN-UA 9003"

**If wrong:** Import may have failed - check import output for errors

### 4.4 Exit EB SSH

```bash
exit
```

---

## PHASE 5: API Endpoint Verification

### 5.1 Test Health Endpoint

```bash
curl -s https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health | jq .
```

**Expected:** `{"ok":true}`  
**If wrong:** Server may be down - check EB status

### 5.2 Test Auth Health Endpoint

```bash
curl -s https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/auth/health | jq .
```

**Expected:** `{"ok":true,"hasSecret":true,"hasAdmin":true,"dbConnected":true}`  
**If wrong:** Check env vars (JWT_SECRET, ADMIN_USERNAME, DATABASE_URL)

### 5.3 Test Login Endpoint

```bash
curl -s -X POST https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}' | jq .
```

**Expected:** `{"ok":true,"token":"..."}`  
**If wrong:** 
- Check credentials
- Check JWT_SECRET is set
- Check CORS allows your origin

### 5.4 Test Catalog Endpoint

```bash
curl -s "https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/books/course/SPAN-UA%209003" | jq .
```

**Expected:** Returns array of books for the course  
**If wrong:** 
- Check database has data (run import)
- Check course code format matches

### 5.5 Test CORS

```bash
curl -s -H "Origin: https://main.d327192gluqcs1.amplifyapp.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health \
  -v 2>&1 | grep -i "access-control"
```

**Expected:** Shows `Access-Control-Allow-Origin: https://main.d327192gluqcs1.amplifyapp.com`  
**If wrong:** Check `CORS_ALLOWED_ORIGINS` env var

---

## PHASE 6: Redeploy Backend

### 6.1 Commit and Push Changes

```bash
cd /Users/shray/nyu-bookstore-finder
git add .
git commit -m "Fix: Production issues - infinite loading, auth, catalog import"
git push origin main
```

**Expected:** Changes pushed to GitHub  
**If wrong:** Check git status and resolve conflicts

### 6.2 Deploy to EB

```bash
cd backend
eb deploy
```

**Expected:** Deployment completes successfully  
**If wrong:** Check EB logs: `eb logs --all | tail -50`

### 6.3 Wait for Deployment

```bash
cd backend
eb status
# Wait until Status: Ready, Health: Green
```

**Expected:** Environment is healthy  
**If wrong:** Check logs and EB console

### 6.4 Verify Deployment

```bash
curl -s https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health | jq .
```

**Expected:** `{"ok":true}`  
**If wrong:** Wait a few minutes for deployment to complete

---

## PHASE 7: Run Smoke Tests

### 7.1 Run Smoke Tests Locally (Against Production)

```bash
cd backend
API_BASE_URL=https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com \
ADMIN_USERNAME="your-username" \
ADMIN_PASSWORD="your-password" \
npm run smoke:prod
```

**Expected:** All tests pass  
**If wrong:** Note which test failed and check corresponding endpoint

### 7.2 Run Smoke Tests on EB

```bash
cd backend
eb ssh
cd /var/app/current/backend
API_BASE_URL=https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com \
ADMIN_USERNAME="your-username" \
ADMIN_PASSWORD="your-password" \
npm run smoke:prod
exit
```

**Expected:** All tests pass  
**If wrong:** Check network connectivity and env vars on EB

---

## PHASE 8: Frontend Configuration

### 8.1 Set Amplify Environment Variable

Go to AWS Amplify Console:
1. Select your app
2. Go to "Environment variables"
3. Add: `REACT_APP_API_URL` = `https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`
4. Save and redeploy

**Expected:** Frontend rebuilds with correct API URL  
**If wrong:** Check Amplify build logs

### 8.2 Verify Frontend Deployment

```bash
# Check Amplify console or
curl -s https://main.d327192gluqcs1.amplifyapp.com | grep -i "api" | head -5
```

**Expected:** Frontend loads and uses correct API URL  
**If wrong:** Check Amplify build logs and env vars

---

## PHASE 9: Post-Deploy Verification

### 9.1 Test Frontend "Find Books" Flow

1. Open: `https://main.d327192gluqcs1.amplifyapp.com`
2. Fill in form (course, dorm, etc.)
3. Click "Find my books"
4. **Expected:** Results load (not infinite spinner)
5. **If wrong:** Check browser console for errors, verify API URL

### 9.2 Test Admin Login

1. Open: `https://main.d327192gluqcs1.amplifyapp.com/login`
2. Enter admin credentials
3. **Expected:** Login succeeds, redirects to admin page
4. **If wrong:** Check browser console, verify JWT_SECRET and credentials

### 9.3 Test Catalog Upload (Admin)

1. Log in as admin
2. Upload CSV file
3. **Expected:** Upload succeeds, shows import summary
4. **If wrong:** Check server logs, verify file format

### 9.4 Verify Dropdowns Show New Data

1. On "Find Books" page, check course dropdown
2. **Expected:** Shows courses from imported CSV
3. **If wrong:** 
   - Clear browser cache
   - Check API returns correct data: `curl -s "https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/books/course/SPAN-UA%209003" | jq .`

---

## PHASE 10: Troubleshooting Commands

### 10.1 Check Server Logs (Real-time)

```bash
cd backend
eb ssh
tail -f /var/log/eb-engine.log
# Or
tail -f /var/log/web.stdout.log
```

### 10.2 Check Database Connection

```bash
cd backend
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -c "SELECT version();"
```

**Expected:** Shows PostgreSQL version  
**If wrong:** Check DATABASE_URL format

### 10.3 Check Node Version

```bash
cd backend
eb ssh
node --version
npm --version
```

**Expected:** Node 20.x  
**If wrong:** Check EB platform configuration

### 10.4 Check Disk Space

```bash
cd backend
eb ssh
df -h
```

**Expected:** Sufficient space (>1GB free)  
**If wrong:** Clean up old deployments or increase instance size

### 10.5 Check Process Memory

```bash
cd backend
eb ssh
free -h
ps aux | grep node | head -5
```

**Expected:** Node process using reasonable memory  
**If wrong:** Check for memory leaks, restart app

---

## Quick Reference: Environment Variables

### Backend (EB)
```bash
eb setenv \
  DATABASE_URL="postgres://user:pass@host:5432/dbname" \
  DB_SSL="true" \
  NODE_ENV="production" \
  CORS_ALLOWED_ORIGINS="https://main.d327192gluqcs1.amplifyapp.com" \
  JWT_SECRET="your-secret-key-here" \
  ADMIN_USERNAME="your-admin-username" \
  ADMIN_PASSWORD_HASH="$2a$10$..." \
  CATALOG_SEMESTER="Fall" \
  CATALOG_YEAR="2025"
```

### Frontend (Amplify)
- `REACT_APP_API_URL` = `https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`

---

## Emergency Rollback

If deployment breaks production:

```bash
cd backend
eb deploy --version previous-version-label
```

Or revert git commit and redeploy:
```bash
git revert HEAD
git push origin main
cd backend && eb deploy
```

---

## Success Criteria

✅ Health endpoint returns `{"ok":true}`  
✅ Auth health shows all checks passing  
✅ Login succeeds and returns JWT token  
✅ Catalog endpoint returns books for courses  
✅ Import script runs successfully  
✅ Smoke tests all pass  
✅ Frontend "Find Books" works (no infinite spinner)  
✅ Admin login works  
✅ Dropdowns show new CSV data  

If all criteria pass, production is fixed! 🎉
