# Production Launch Checklist - BookMap

## Pre-Deployment Setup

### 1. Environment Variables

#### AWS Amplify (Frontend)
```
REACT_APP_API_URL=https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com
```

**Where to set:**
- AWS Amplify Console → Your App → Environment variables → Manage variables
- Add `REACT_APP_API_URL` with your EB URL
- **Important:** Do NOT include `/api` in the URL

#### Elastic Beanstalk (Backend)
```
DATABASE_URL=postgres://user:pass@host:port/dbname
DB_SSL=true
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://main.d327192gluqcs1.amplifyapp.com
JWT_SECRET=<generate-strong-secret>
ADMIN_USERNAME=<your-admin-username>
ADMIN_PASSWORD_HASH=<bcrypt-hash-of-password>
```

**Where to set:**
```bash
eb setenv DATABASE_URL="..." DB_SSL="true" NODE_ENV="production" CORS_ALLOWED_ORIGINS="https://main.d327192gluqcs1.amplifyapp.com" JWT_SECRET="..." ADMIN_USERNAME="..." ADMIN_PASSWORD_HASH="..."
```

### 2. Database Setup

**Run database schema on RDS:**
```bash
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -f backend/database-rds.sql
exit
```

### 3. Import Catalog CSV

**Local validation:**
```bash
cd backend
npm run catalog:import -- --file "/mnt/data/course_catalog (1).csv"
```

**On Elastic Beanstalk:**
```bash
# Option 1: Upload CSV and use script
eb ssh
cd /var/app/current
# Upload CSV file first, then:
npm run catalog:import -- --file "/path/to/uploaded/file.csv"

# Option 2: Use API endpoint
curl -X POST https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/catalog/import-csv \
  -H "Authorization: Bearer <your-token>" \
  -F "catalog=@/path/to/course_catalog.csv"
```

## Deployment Steps

### Step 1: Commit and Push Code
```bash
git add .
git commit -m "Production-ready: CSV import, security hardening, error handling"
git push origin main
```

### Step 2: Deploy Backend to EB
```bash
cd backend
eb deploy
eb status  # Verify health is Green
```

### Step 3: Deploy Frontend to Amplify
- Amplify auto-deploys on git push
- Or trigger manual deploy in Amplify Console
- Verify environment variable `REACT_APP_API_URL` is set

### Step 4: Run Database Schema
```bash
eb ssh
cd /var/app/current
psql "$DATABASE_URL" -f backend/database-rds.sql
exit
```

### Step 5: Import Catalog
```bash
# On EB instance
eb ssh
cd /var/app/current
npm run catalog:import -- --file "/path/to/course_catalog.csv"
exit
```

### Step 6: Verify Health Endpoints
```bash
curl https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health
curl https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/health
```

### Step 7: Test Frontend
1. Open Amplify URL in browser
2. Check browser console for `[apiClient] API_BASE_URL:` log
3. Test "Find My Books" flow
4. Verify no infinite spinners
5. Test error handling (disconnect internet, should show error)

### Step 8: Test Catalog Import
1. Login as admin
2. Upload CSV via Admin page
3. Verify catalog data is replaced
4. Check import summary shows correct counts

### Step 9: Run Tests
```bash
# Backend tests
cd backend
npm test

# Verify all tests pass
```

### Step 10: Monitor Logs
```bash
# Backend logs
eb logs --stream

# Check for errors
eb logs --all | grep -i error
```

## Verification Checklist

- [ ] Backend health endpoint returns 200
- [ ] Frontend loads without errors
- [ ] API calls go to correct EB URL (check browser Network tab)
- [ ] "Find My Books" works without infinite spinner
- [ ] Error handling shows user-friendly messages
- [ ] CORS is configured correctly
- [ ] Catalog import replaces all data
- [ ] Database schema is applied
- [ ] All environment variables are set
- [ ] No hardcoded secrets in production
- [ ] Rate limiting is active
- [ ] Security headers (helmet) are active

## Troubleshooting

### Infinite "Finding books..." Spinner
1. Check browser console for API errors
2. Verify `REACT_APP_API_URL` is set in Amplify
3. Check CORS configuration in EB
4. Verify backend is healthy: `eb status`

### CORS Errors
1. Verify `CORS_ALLOWED_ORIGINS` includes your Amplify URL
2. Check backend logs: `eb logs --all | grep CORS`
3. Ensure URL matches exactly (no trailing slash)

### Database Connection Errors
1. Verify `DATABASE_URL` is set correctly
2. Check RDS security group allows EB instance
3. Test connection: `eb ssh` then `psql "$DATABASE_URL" -c "SELECT 1;"`

### Catalog Not Updating
1. Clear browser cache
2. Verify import completed: Check import summary
3. Check database: `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM courses;"`

## Commands Reference

```bash
# Run tests
cd backend && npm test

# Import catalog locally
cd backend && npm run catalog:import -- --file "/path/to/file.csv"

# Import catalog on EB
eb ssh
cd /var/app/current
npm run catalog:import -- --file "/path/to/file.csv"

# Check backend status
eb status

# View logs
eb logs --stream
eb logs --all | grep -i error

# Set environment variables
eb setenv KEY=value

# Deploy
eb deploy
```

## Security Notes

- ✅ No `.env` files in production (uses EB environment variables)
- ✅ Helmet security headers enabled
- ✅ Rate limiting active (100 req/15min per IP)
- ✅ Body size limits (1MB)
- ✅ CORS properly configured
- ✅ Error handling doesn't expose stack traces in production
- ✅ JWT secrets use environment variables
- ⚠️ Default passwords in code are fallbacks only (not used in production)

## Files Changed Summary

### Backend
- `server.js` - Security hardening, CORS fix, error handling
- `routes/catalog.js` - CSV support, complete data replacement
- `utils/csvParser.js` - NEW: Robust CSV parser
- `utils/catalogImporter.js` - NEW: Idempotent catalog importer
- `scripts/importCatalog.js` - NEW: CLI import script
- `package.json` - Added test dependencies and scripts
- `tests/health.test.js` - NEW: Health endpoint tests
- `tests/catalog.test.js` - NEW: Catalog import tests

### Frontend
- `services/apiClient.js` - Production-safe API client with timeout
- `services/api.js` - Uses apiClient
- `pages/FindBooksPage.js` - Error handling, cache clearing

### Documentation
- `PRODUCTION_LAUNCH.md` - This file
- `FRONTEND_API_FIX.md` - Frontend API fixes documentation
