# Manual Steps Required to Complete Timeout Fix

## ✅ Completed Automatically

1. ✅ Code optimized (eliminated N+1 queries)
2. ✅ Timing logs added
3. ✅ 10s timeout guard added
4. ✅ Tests created
5. ✅ Frontend updated for VITE_API_BASE_URL
6. ✅ Code committed and pushed
7. ✅ Backend deployed to EB

## ⚠️ Manual Steps Required

### Step 1: Apply Database Indexes (CRITICAL for performance)

**Why:** The optimized queries need indexes to perform well.

**Command:**
```bash
cd backend
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -f backend/database-indexes.sql
exit
```

**Expected output:**
```
CREATE INDEX
CREATE INDEX
...
ANALYZE
```

**Verify:**
```bash
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -c "\d+ courses" | grep -i index
exit
```

### Step 2: Reset Catalog Data (if dropdowns show old data)

**Why:** Ensures dropdowns and search use the new CSV data.

**Command:**
```bash
cd backend
eb ssh
cd /var/app/current
npm run catalog:reset -- database/seed/course_catalog.csv
exit
```

**Expected output:**
```
[resetCatalog] Reading CSV from ...
[resetCatalog] Parsing CSV...
[resetCatalog] Found X courses, Y books
[resetCatalog] Import complete: {coursesCreated: X, booksCreated: Y, ...}
```

**Verify:**
```bash
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM courses;"
psql "$DATABASE_URL" -c "SELECT code, name FROM courses WHERE code LIKE 'WREX%' LIMIT 5;"
exit
```

### Step 3: Set Frontend Environment Variable

**Why:** Frontend needs to know the API URL.

**Steps:**
1. Go to AWS Amplify Console
2. Select your app
3. Click "Environment variables" in left sidebar
4. Click "Manage variables"
5. Add:
   - **Key:** `REACT_APP_API_URL` (or `VITE_API_BASE_URL` if using Vite)
   - **Value:** `https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`
6. Click "Save"
7. Wait for Amplify to redeploy (2-5 minutes)

**Verify:**
- Open your app: `https://main.d327192gluqcs1.amplifyapp.com`
- Open DevTools Console (F12)
- Look for: `[apiClient] API_BASE_URL: https://bookmap-api-dev...`

## Verification Tests

### Test 1: Backend Endpoint (Should complete in <2s)

```bash
curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/students/search \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","dorm":"Chamberi","course":"WREX-UF 9101","professor":"Weubben"}' \
  --max-time 5 -w "\nTime: %{time_total}s\nHTTP: %{http_code}\n"
```

**Expected:**
- Response in <2 seconds
- HTTP 200 (success) or 400 (validation error)
- JSON response with `success: true` or error message

**If timeout:**
- Check if indexes were applied (Step 1)
- Check logs: `eb logs --all | grep "students/search" | tail -20`

### Test 2: Check Logs for Timing

```bash
cd backend
eb logs --all | grep "students/search" | tail -10
```

**Expected log format:**
```
[students/search] req-1234567890-abc123 START {body: {...}}
[students/search] req-1234567890-abc123 STEP1: dorm lookup 3ms
[students/search] req-1234567890-abc123 STEP2: course lookup 5ms
[students/search] req-1234567890-abc123 STEP4: books query 15ms (2 books)
[students/search] req-1234567890-abc123 STEP5: bookstores query 120ms (5 stores)
[students/search] req-1234567890-abc123 SUCCESS 143ms
```

**If STEP5 takes >1s:**
- Indexes may not be applied
- Database may be slow
- Check database connection

### Test 3: Frontend (After env var is set)

1. Open: `https://main.d327192gluqcs1.amplifyapp.com`
2. Fill in "Find Books" form
3. Click "Find my books"
4. **Expected:** Results load in <2 seconds (no timeout)
5. **If timeout:** Check browser console for API URL and errors

## Troubleshooting

### Issue: Still timing out after indexes

**Check:**
1. Are indexes actually created?
   ```bash
   eb ssh
   psql "$DATABASE_URL" -c "\d+ courses" | grep -i index
   ```

2. Is database connection working?
   ```bash
   eb ssh
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

3. Are there any slow queries in logs?
   ```bash
   eb logs --all | grep "STEP5" | grep -E "[0-9]{4,}ms"
   ```

### Issue: 504 Timeout errors

**This is expected** if query takes >10s. The timeout guard is working.

**Fix:**
- Apply indexes (Step 1)
- Check database performance
- Verify catalog data exists

### Issue: No data in dropdowns

**Fix:**
- Run catalog reset (Step 2)
- Verify CSV file exists on EB
- Check import logs for errors

## Summary

**Critical Steps:**
1. ✅ Apply database indexes (Step 1) - **REQUIRED for performance**
2. ✅ Reset catalog (Step 2) - **REQUIRED if data is old**
3. ✅ Set frontend env var (Step 3) - **REQUIRED for frontend to work**

**After completing all steps:**
- Backend should respond in <2s
- Frontend should work without timeouts
- Logs should show timing for each step

See `TIMEOUT_FIX_SUMMARY.md` for complete details.
