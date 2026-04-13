# AI Learning Frontend

## Local Run

```bash
npm install
cp .env.example .env
npm run dev
```

## Render Deployment (Frontend as Static Site)

Create a new Static Site in Render and point it to this repository.

Use these settings:
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

Set this environment variable in Render:
- `VITE_API_BASE_URL` = your backend API base URL (example: `https://your-backend.onrender.com/api`)

Add a rewrite rule in Render so React Router works on refresh:
- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

After deployment:
- Copy your frontend URL and add it to backend `CLIENT_URLS`.
