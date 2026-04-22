AWS Zero-Downtime Cutover Checklist

Scope
- Backend on AWS App Runner
- Frontend on AWS Amplify Hosting
- MongoDB Atlas remains the database

Pre-Cutover (T-7 to T-1 days)
1. Create production infrastructure
- Create App Runner service from backend folder.
- Create Amplify app from frontend folder.
- Enable automatic TLS certificates for both services.

2. Configure production environment variables
- Backend: use values from backend/.env.production.example.
- Frontend: use values from frontend/.env.production.example.
- Set CLIENT_URLS to the exact frontend domain(s).
- Set VITE_API_BASE_URL to the final API domain plus /api.

3. Verify production health before DNS switch
- Backend health endpoint returns 200 at /api/health.
- Test registration, login, dashboard load, and protected routes.
- Test AI endpoints if OPENAI_API_KEY is set.
- Test Stripe checkout and success/cancel redirects if STRIPE_SECRET_KEY is set.
- Test file uploads and confirm expected behavior.

4. Prepare DNS with low TTL
- Reduce DNS TTL for app and api records to 60 seconds at least 24 hours before cutover.
- Create new records but do not switch traffic yet.

5. Data and rollback readiness
- Confirm MongoDB backups/snapshots are enabled.
- Keep old frontend/backend deployment live and unchanged during cutover window.
- Prepare rollback plan: revert DNS records to old targets.

Cutover Window (T-0)
1. Freeze risky changes
- Pause schema/data migrations.
- Pause non-essential releases.

2. Final smoke test on AWS endpoints
- Backend /api/health is healthy.
- Frontend can call backend with no CORS errors.

3. Switch frontend traffic first
- Point app domain DNS to Amplify target.
- Validate page load and route refresh behavior.

4. Switch backend traffic second
- Point api domain DNS to App Runner target.
- Confirm API calls from frontend succeed.

5. Validate critical user journeys
- New student registration and login.
- Student dashboard loads.
- Enroll flow and course access.
- Quiz submission and score view.
- Any payment path in scope.

6. Monitor closely for 60 minutes
- App Runner logs: 5xx rates, startup errors, timeout spikes.
- Browser console/network for CORS and auth issues.
- MongoDB connection metrics and error rates.

Post-Cutover (T+1 hour to T+7 days)
1. Keep old stack warm for fast rollback (at least 24 to 72 hours).
2. Increase DNS TTL after stability is confirmed.
3. Remove temporary broad network allowlists in Atlas and tighten access.
4. Capture known production baseline metrics.
5. Schedule upload storage hardening if needed.

Known project-specific notes
1. CORS is strict and based on CLIENT_URLS; exact origin match is required.
2. Stripe success/cancel URLs are built from clientUrl (first entry in CLIENT_URLS), so place primary frontend domain first.
3. Uploads are currently served from local filesystem under /uploads; on container restarts/redeploys these files may be lost. Plan S3 migration for durable media storage.
4. Google sign-in requires both backend GOOGLE_CLIENT_ID and frontend VITE_GOOGLE_CLIENT_ID.

Rollback Plan
1. Revert DNS for app and api to old targets.
2. Keep old environment variables unchanged.
3. Confirm /api/health and main user journeys on old stack.
4. Investigate AWS logs, fix, and retry cutover in a new window.
