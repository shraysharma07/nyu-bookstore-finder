# Deployment Verification Commands

## Quick Verification (After Deployment)

### 1. Health Check

```bash
curl http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health
```

**Expected:** `{"ok":true}`

### 2. Students Search (Should return in <1 second)

```bash
curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/students/search \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","dorm":"Chamberi","course":"WREX-UF 9101","professor":"Weubben"}' \
  --max-time 2 -w "\nTime: %{time_total}s\nHTTP: %{http_code}\n"
```

**Expected:**
- Time: <1 second
- HTTP: 200, 400, or 503 (not 500 or timeout)
- Response: JSON (not HTML error)

### 3. Admin Login

```bash
curl -X POST http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'
```

**Expected:** `{"ok":true,"token":"..."}`

### 4. Check Logs

```bash
cd backend
eb logs --all | grep -E "students/search.*SUCCESS|students/search.*ERROR|students/search.*503" | tail -10
```

**Expected:** Logs show request processing (SUCCESS, ERROR, or 503)

## Full Verification Checklist

- [ ] Health endpoint returns 200
- [ ] API health endpoint returns 200
- [ ] Auth health shows dbConnected: true
- [ ] Students search returns in <1 second
- [ ] Admin login returns token
- [ ] Catalog endpoints return data (after import)
- [ ] Frontend can connect (set REACT_APP_API_URL)
- [ ] "Find my books" button works (no infinite loading)
