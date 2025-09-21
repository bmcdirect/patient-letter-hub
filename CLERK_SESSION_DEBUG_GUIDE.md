# Clerk Session Persistence Debug Guide

## Browser Application Tab Investigation

### Step 1: Open Browser Developer Tools
1. Navigate to `http://localhost:3002`
2. Press `F12` or right-click → "Inspect"
3. Go to **Application** tab

### Step 2: Check Cookies
In the Application tab, look for:

**Cookies → http://localhost:3002**
- Look for cookies starting with `__clerk` or `__session`
- Common Clerk cookies:
  - `__clerk_db_jwt`
  - `__clerk_session_token`
  - `__session`
  - `clerk-session`

**Expected Behavior:**
- After successful sign-in, you should see Clerk session cookies
- These cookies should persist across page refreshes
- If no Clerk cookies appear, this indicates session creation failure

### Step 3: Check Session Storage
**Session Storage → http://localhost:3002**
- Look for Clerk-related entries
- Check for authentication tokens or session data

**Local Storage → http://localhost:3002**
- Look for Clerk-related entries
- Check for user data or session information

### Step 4: Check Network Tab
1. Go to **Network** tab
2. Attempt to sign in
3. Look for:
   - POST requests to Clerk endpoints
   - Response headers containing `Set-Cookie`
   - Any error responses from Clerk

## Expected Clerk Cookie Pattern

After successful authentication, you should see:
```
__clerk_db_jwt=<token>
__clerk_session_token=<token>
__session=<session_data>
```

## Debugging Steps

### Test 1: Fresh Sign-in
1. Clear all cookies for localhost:3002
2. Navigate to `/sign-in`
3. Attempt to sign in
4. Check if Clerk cookies appear
5. Navigate to `/dashboard`
6. Check if cookies persist

### Test 2: Cookie Persistence
1. After successful sign-in
2. Refresh the page
3. Check if Clerk cookies remain
4. Navigate to different pages
5. Verify cookies persist across navigation

### Test 3: Session Validation
1. Open browser console
2. Check for Clerk-related JavaScript errors
3. Look for authentication state changes
4. Monitor network requests for Clerk API calls

## Common Issues

### Issue 1: No Clerk Cookies Set
**Symptoms:** No `__clerk` cookies after sign-in
**Causes:**
- Domain mismatch in Clerk configuration
- Development keys not configured for localhost
- CORS issues

### Issue 2: Cookies Set But Not Persisting
**Symptoms:** Cookies appear briefly then disappear
**Causes:**
- Cookie domain/path mismatch
- Secure cookie settings for HTTP
- Browser security policies

### Issue 3: Cookies Present But userId Undefined
**Symptoms:** Clerk cookies exist but middleware shows `userId: undefined`
**Causes:**
- Cookie parsing issues
- Session token corruption
- Clerk middleware configuration problems

## Next Steps

Based on browser investigation results:
1. **No cookies**: Check Clerk development environment configuration
2. **Cookies present**: Check middleware cookie parsing
3. **Intermittent cookies**: Check cookie security settings
4. **All good**: Check server-side session validation
