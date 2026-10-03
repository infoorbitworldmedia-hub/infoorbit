# InfoOrbit Media Website

Full-stack starter for **InfoOrbit — Your World. One Orbit.**

## Included
- Responsive media homepage
- News story API + admin creation/deletion
- Newsletter subscription API
- Contact form API
- JSON persistence in `data/content.json`
- Gmail delivery for contact messages through Nodemailer
- Helmet security headers
- Health endpoint at `/api/health`

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Fill in `GMAIL_APP_PASSWORD` and a strong `ADMIN_TOKEN`.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

### Gmail setup
Use a **Google App Password**, not your normal Gmail password. The Google account must have 2-Step Verification enabled. Never put the App Password into frontend JavaScript or commit `.env` to Git.

### Admin API
Use header `x-admin-token: YOUR_ADMIN_TOKEN`.
- `POST /api/admin/stories` with `{title,summary,category}`
- `DELETE /api/admin/stories/:id`
- `GET /api/admin/messages`
- `GET /api/admin/subscribers`

## Deployment
This package can be deployed to any Node.js host that supports persistent storage and environment variables. Set the same variables from `.env.example` in the host dashboard. For production, replace JSON-file persistence with a managed database if multiple editors or high traffic are expected.
