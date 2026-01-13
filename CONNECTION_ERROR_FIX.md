# Fix: "Unable to connect to server" Error

## What This Error Means

The error **"Unable to connect to server. Please check your connection."** means your **frontend (Amplify)** cannot reach your **backend (Elastic Beanstalk)** API.

## Root Causes

### 1. **Frontend Using Wrong API URL** (Most Likely)
- Frontend doesn't have `REACT_APP_API_URL` set in Amplify
- Frontend is trying to use `localhost` or a wrong URL
- Frontend is trying to use HTTPS (which times out) instead of HTTP

### 2. **CORS Blocking the Request**
- Backend CORS configuration doesn't allow your Amplify origin
- Browser blocks the request before it reaches the server

### 3. **Network/Firewall Issue**
- Security groups blocking traffic
- Load balancer misconfiguration

## Quick Diagnosis

### Check What URL Frontend Is Using

1. Open your Amplify app: `https://main.d327192gluqcs1.amplifyapp.com`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for: `[apiClient] API_BASE_URL: ...`
5. Go to Network tab
6. Try to use the app (login or search)
7. Check the failed request - what URL is it trying to reach?

**Expected:** `http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/...`  
**Wrong:** `http://localhost:5000/api/...` or `https://...` (HTTPS times out)

## Fix Steps

### Step 1: Set Amplify Environment Variable

1. Go to **AWS Amplify Console**
2. Select your app
3. Click **"Environment variables"** in left sidebar
4. Click **"Manage variables"**
5. Add new variable:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`
   - **Important:** Use **HTTP** (not HTTPS) because HTTPS is timing out
6. Click **"Save"**
7. **Redeploy** the app (or wait for auto-deploy)

### Step 2: Verify CORS Configuration

Check that backend allows your Amplify origin:

```bash
cd backend
eb printenv | grep CORS_ALLOWED_ORIGINS
```

**Expected:** `CORS_ALLOWED_ORIGINS = https://main.d327192gluqcs1.amplifyapp.com`

If not set:
```bash
eb setenv CORS_ALLOWED_ORIGINS="https://main.d327192gluqcs1.amplifyapp.com"
```

### Step 3: Test Backend Directly

```bash
# Test health endpoint
curl http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health

# Test with CORS headers
curl -H "Origin: https://main.d327192gluqcs1.amplifyapp.com" \
  http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health
```

**Expected:** Both return `{"ok":true}`

### Step 4: Verify Frontend After Redeploy

1. Wait for Amplify to finish redeploying (check Amplify console)
2. Open your app: `https://main.d327192gluqcs1.amplifyapp.com`
3. Open DevTools Console
4. Look for: `[apiClient] API_BASE_URL: http://bookmap-api-dev...`
5. Try to use the app again
6. Check Network tab for successful requests

## Common Issues

### Issue: Frontend Still Shows "Unable to connect"

**Possible causes:**
1. Amplify hasn't finished redeploying (wait 2-5 minutes)
2. Browser cache - hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Wrong API URL still in build - check Amplify build logs

**Fix:**
- Clear browser cache
- Hard refresh the page
- Check Amplify build logs for `REACT_APP_API_URL`

### Issue: CORS Error in Browser Console

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Fix:**
```bash
cd backend
eb setenv CORS_ALLOWED_ORIGINS="https://main.d327192gluqcs1.amplifyapp.com"
eb deploy  # Redeploy to apply CORS changes
```

### Issue: HTTPS Timeout

**Symptom:** HTTPS requests timeout, HTTP works

**Current Status:** HTTPS is timing out on your EB instance

**Solution:** Use HTTP for now (it works):
- Set `REACT_APP_API_URL=http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`
- HTTP is fine for API calls (data is not sensitive)

**Future Fix:** Configure SSL certificate on EB load balancer

## Verification Checklist

- [ ] `REACT_APP_API_URL` set in Amplify environment variables
- [ ] Value is `http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com` (HTTP, not HTTPS)
- [ ] Amplify app redeployed after setting env var
- [ ] Browser console shows correct `API_BASE_URL`
- [ ] Network tab shows requests going to correct URL
- [ ] Backend health endpoint works: `curl http://bookmap-api-dev.../api/health`
- [ ] CORS allows Amplify origin

## Quick Test Command

After setting env var and redeploying, test from browser console:

```javascript
// In browser console on your Amplify app
fetch('http://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected:** `{ok: true}`  
**If error:** Check CORS or network issues
