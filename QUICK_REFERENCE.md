# Quick Reference - Production Commands

## Environment Variables

### Amplify
```
REACT_APP_API_URL=https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com
```

### Elastic Beanstalk
```bash
eb setenv \
  DATABASE_URL="postgres://..." \
  DB_SSL="true" \
  NODE_ENV="production" \
  CORS_ALLOWED_ORIGINS="https://main.d327192gluqcs1.amplifyapp.com" \
  JWT_SECRET="<strong-secret>" \
  ADMIN_USERNAME="<username>" \
  ADMIN_PASSWORD_HASH="<bcrypt-hash>"
```

## Commands

### Tests
```bash
cd backend && npm test
```

### Import Catalog Locally
```bash
cd backend
npm run catalog:import -- --file "/path/to/course_catalog.csv"
```

### Import Catalog on EB
```bash
eb ssh
cd /var/app/current
npm run catalog:import -- --file "/path/to/course_catalog.csv"
exit
```

### Deploy
```bash
# Backend
cd backend && eb deploy

# Frontend (auto-deploys on git push to Amplify)
git push origin main
```

### Check Status
```bash
eb status
eb logs --stream
```

## CSV File Location

**Note:** The CSV file `/mnt/data/course_catalog (1).csv` should be:
- Uploaded to EB instance if importing via script
- Or uploaded via the Admin UI (CatalogUploader component)
- Or accessible via file path on the server

**CSV Format:**
- Columns: Teacher, Course Code, Class Title, Author, Title, ISBN, Required or Supplemental, Notes, Type of Class, Digital?, First year/Notes
- First row is header
- Supports quoted fields with commas

## Verification

```bash
# Health check
curl https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health

# Test catalog endpoint
curl https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/catalog/summary
```
