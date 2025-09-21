# Testing Environment Setup for Authentication Rebuild

## Vercel Preview Deployment
- **Branch**: `auth-rebuild`
- **Preview URL**: Will be generated automatically by Vercel
- **Database Access**: Same Azure PostgreSQL database (safe for testing)
- **Environment Variables**: Same as production (inherited from main branch)

## Testing Safety Measures
✅ **Isolated Environment**: Preview deployment won't affect production users
✅ **Same Database**: Can test with real data without risk
✅ **Rollback Ready**: Can switch back to main branch instantly
✅ **No Production Impact**: Changes only affect preview URL

## Environment Variables (Inherited)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Same as production
- `CLERK_SECRET_KEY` - Same as production  
- `DATABASE_URL` - Same Azure database
- `NEXT_PUBLIC_USE_CLERK=true` - Clerk enabled
- `NEXT_PUBLIC_APP_URL` - Will be preview URL

## Testing Strategy
1. **Phase 1**: Test current state on preview URL
2. **Phase 2**: Implement simplified Clerk-only authentication
3. **Phase 3**: Test all authentication flows
4. **Phase 4**: Deploy to production (only when ready)

## Preview URL Access
- Vercel will generate preview URL automatically
- URL format: `https://patient-letter-hub-git-auth-rebuild-[username].vercel.app`
- Can be shared with team for testing
- Same functionality as production but isolated

## Database Safety
- Using same database is safe because:
  - Preview environment is read-only for user data
  - No production users will access preview URL
  - Can test with existing user accounts
  - No risk of data corruption

## Next Steps
1. Wait for Vercel preview deployment
2. Test current authentication on preview URL
3. Begin authentication rebuild process
4. Test each phase before proceeding
