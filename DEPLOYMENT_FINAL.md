# Final Deployment Steps

## ✅ Code Changes Committed and Pushed

All fixes have been implemented and deployed to Elastic Beanstalk.

## Required Manual Steps

### 1. Apply Database Migration (CRITICAL)

Run the migration to add `code_normalized` column:

```bash
cd backend
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -f backend/database-migration-code-normalized.sql
exit
```

**Expected:** Migration completes, `code_normalized` column added and indexed.

**Verify:**
```bash
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -c "\d+ courses" | grep -i "code_normalized"
exit
```

### 2. Backfill Code Normalized (if needed)

If existing courses don't have `code_normalized` populated, run:

```bash
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -c "UPDATE courses SET code_normalized = UPPER(TRIM(REPLACE(REPLACE(code, '.', ' '), '-', ' '))) WHERE code_normalized IS NULL;"
psql "$DATABASE_URL" -c "UPDATE courses SET code_normalized = REGEXP_REPLACE(code_normalized, '\s+', ' ', 'g') WHERE code_normalized IS NOT NULL;"
exit
```

### 3. Reset Catalog (if database is empty)

```bash
cd backend
eb ssh
cd /var/app/current
npm run catalog:reset -- --file database/seed/course_catalog.csv
exit
```

### 4. Set Frontend Environment Variable (Amplify)

In Amplify console, set:
- `REACT_APP_API_URL=http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`

OR

- `VITE_API_BASE_URL=http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`

**Note:** Use `http://` not `https://` (HTTPS not enabled).

## Verification Commands

### Test Health Endpoint

```bash
curl http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health
```

**Expected:** `{"ok":true}`

### Test Students Search (Format 1)

```bash
curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/students/search \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","dorm":"Chamberi","course":"WREX-UF 9101"}' \
  --max-time 2 -w "\nTime: %{time_total}s\nHTTP: %{http_code}\n"
```

**Expected:**
- Time: <1 second
- HTTP: 200, 400, or 503 (not 500)
- Response contains `requiredBooks` array (and `books` alias)

### Test Students Search (Format 2)

```bash
curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/students/search \
  -H "Content-Type: application/json" \
  -d '{"dorm":"Chamberi","course":"WREX-UF 9101","professor":"Weubben"}' \
  --max-time 2 -w "\nTime: %{time_total}s\nHTTP: %{http_code}\n"
```

**Expected:**
- Time: <1 second
- HTTP: 200, 400, or 503 (not 500)
- Response contains `requiredBooks` array (and `books` alias)

### Test Admin Login

```bash
curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'
```

**Expected:** `{"ok":true,"token":"..."}` or `{"ok":false,"error":"invalid_credentials"}`

### Run Smoke Tests on EB

```bash
cd backend
eb ssh
cd /var/app/current/backend
API_BASE_URL=http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com \
ADMIN_USERNAME="your-username" \
ADMIN_PASSWORD="your-password" \
node scripts/smokeTests.js
exit
```

**Expected:** All tests pass

## Summary of Changes

### Backend
1. ✅ Created `backend/utils/normalize.js` - Course code normalization utility
2. ✅ Created `database-migration-code-normalized.sql` - Migration script
3. ✅ Updated `backend/routes/students.js` - Accepts both payload formats, uses normalized codes
4. ✅ Updated `backend/utils/catalogImporter.js` - Stores normalized course codes
5. ✅ Updated `backend/scripts/smokeTests.js` - Tests both payload formats

### Frontend
1. ✅ Updated `frontend/src/pages/FindBooksPage.js` - Fixed payload and response handling

## Key Features

- **Backwards Compatible**: Accepts both `{name, dorm, course}` and `{dorm, course, professor}` formats
- **Normalized Course Codes**: Handles "SPAN-UA.9050" vs "SPAN-UA 9050" consistently
- **Response Schema**: Returns `requiredBooks` and `books` alias (backwards compatibility)
- **Error Handling**: Proper status codes and error messages
- **Frontend**: Handles errors properly, stops spinner, shows messages

## Next Steps After Migration

1. Apply migration (step 1 above)
2. Backfill code_normalized (step 2 above)
3. Reset catalog if needed (step 3 above)
4. Set frontend env var (step 4 above)
5. Test with curl commands (verification section)
6. Test in browser
