# Frontend API Fix - Production Deployment Guide

## Problem Fixed
- Frontend was stuck on "Finding books..." spinner
- API calls were failing due to incorrect base URL (falling back to `/api` which doesn't work in production)
- No timeout on requests (could hang forever)
- Poor error handling (spinner never stopped on errors)

## Solution Implemented

### 1. New API Client (`frontend/src/services/apiClient.js`)
- ✅ Reads `REACT_APP_API_URL` or `REACT_APP_API_BASE_URL` from environment
- ✅ Falls back to `http://localhost:5000/api` in local dev
- ✅ 15-second timeout on all requests
- ✅ Robust error handling (timeout, network errors, HTTP errors)
- ✅ Proper error messages for users

### 2. Updated API Service (`frontend/src/services/api.js`)
- ✅ Now uses the new `apiClient` instead of inline fetch logic
- ✅ All existing methods work the same way (backwards compatible)

### 3. Enhanced Error Handling (`frontend/src/pages/FindBooksPage.js`)
- ✅ Added error state to display user-friendly error messages
- ✅ Stops spinner on error
- ✅ Shows visible error message with dismiss button
- ✅ Logs detailed error info to console for debugging

## Amplify Environment Variable

**Set this in your Amplify Console:**

```
REACT_APP_API_URL=https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com
```

**Where to set it:**
1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables** (left sidebar)
4. Click **Manage variables**
5. Add:
   - **Variable name**: `REACT_APP_API_URL`
   - **Value**: `https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com`
6. Save and redeploy

**Important Notes:**
- The URL should NOT include `/api` at the end (the client adds it automatically)
- The URL should include `https://` protocol
- After setting the variable, you must **redeploy** your Amplify app for changes to take effect

## Code Changes Summary

### New Files
- `frontend/src/services/apiClient.js` - Production-safe API client with timeout

### Modified Files
- `frontend/src/services/api.js` - Now imports from `apiClient`
- `frontend/src/pages/FindBooksPage.js` - Added error state and display

## Testing

### Local Development
```bash
# No env var needed - defaults to http://localhost:5000/api
npm start
```

### Production (After Setting Env Var)
1. Set `REACT_APP_API_URL` in Amplify
2. Redeploy Amplify app
3. Test the "Find My Books" flow
4. Check browser console for API calls (should show correct URL)
5. Verify errors show user-friendly messages instead of hanging

## Error Messages Users Will See

- **Timeout**: "Request timed out. The server may be slow or unreachable. Please try again."
- **Network Error**: "Unable to connect to the server. Please check your internet connection and try again."
- **Other Errors**: Shows the actual error message from the server

## Verification Checklist

- [ ] Set `REACT_APP_API_URL` in Amplify environment variables
- [ ] Redeploy Amplify app
- [ ] Test "Find My Books" flow
- [ ] Verify API calls go to correct EB URL (check browser Network tab)
- [ ] Test error handling (disconnect internet, should show error message)
- [ ] Verify spinner stops on error
- [ ] Check browser console for `[apiClient] API_BASE_URL:` log message

## Troubleshooting

### Still seeing "Finding books..." spinner
1. Check browser console for errors
2. Check Network tab - are requests going to the right URL?
3. Verify `REACT_APP_API_URL` is set correctly in Amplify
4. Check if CORS is working (should see CORS errors in console if not)

### API calls going to wrong URL
1. Verify environment variable is set: `REACT_APP_API_URL`
2. Check browser console for `[apiClient] API_BASE_URL:` log
3. Clear browser cache and hard refresh
4. Redeploy Amplify app

### Timeout errors
1. Check if EB environment is healthy: `eb status`
2. Test API directly: `curl https://bookmap-api-dev.eba-2v9jbzmr.eu-west-1.elasticbeanstalk.com/api/health`
3. Check EB logs for errors: `eb logs --all`
