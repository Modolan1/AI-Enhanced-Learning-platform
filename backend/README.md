# AI Learning Backend

## Local Run

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

Demo accounts after seeding:
- admin@example.com / password123
- student@example.com / password123
- instructor@example.com / password123

## Render Deployment (Backend as Web Service)

Create a new Web Service in Render and point it to this repository.

Use these settings:
- Root Directory: `backend`
- Environment: `Node`
- Build Command: `npm ci`
- Start Command: `npm start`

Set these environment variables in Render:
- `MONGO_URI` = your MongoDB connection string
- `JWT_SECRET` = a long random secret
- `JWT_EXPIRES_IN` = `7d`
- `OPENAI_API_KEY` = your OpenAI API key
- `OPENAI_MODEL` = `gpt-4o-mini`
- `CLIENT_URLS` = your frontend origin(s), comma-separated
- `DOCUMENT_UPLOAD_MAX_BYTES` = `5242880`
- `BCRYPT_SALT_ROUNDS` = `12`
- `PASSWORD_PEPPER` = optional extra secret

Notes:
- `PORT` is automatically provided by Render.
- After frontend is deployed, update `CLIENT_URLS` with the exact frontend URL.
