# Naveed Abbas Portfolio (React + Firebase)

## Big Picture (Simple Explanation)

This project is a **smart personal website** with a built-in **control room**.

- The public website is what visitors see: profile, about, projects, resume, and contact form.
- The admin panel is where the owner updates everything without editing code.
- Firebase works as the engine in the background:
  - **Auth** checks who is allowed to manage content.
  - **Firestore** stores all text/data (projects, skills, messages, etc.).
  - **Storage** stores uploaded files/images (profile photo, hero image, resume file).
  - **Hosting** publishes the site online.

### How it works in real life

1. A visitor opens the portfolio and sees live content.
2. If they send a message, it is saved safely in the database.
3. The owner logs into admin and updates sections like Projects or Skills.
4. Changes are saved in Firestore and appear on the website almost instantly.

In short: **one system, two experiences** — a clean public portfolio for visitors, and a secure admin dashboard for content management.

Production-ready personal portfolio with:
- Public portfolio pages (Hero, About, Projects, Contact, Resume)
- Admin panel for content management
- Realtime Firestore-backed content updates
- Firebase Storage uploads (profile/hero/resume files)

## Tech Stack

- React (`react-scripts`)
- React Router
- Firebase Auth, Firestore, Storage, Analytics
- Bootstrap + custom CSS
- EmailJS for contact email delivery

## Project Structure

- `src/App.js` — routing and auth-gated admin route
- `src/components/Admin.js` — admin container using tab modules
- `src/pages/Admin/*` — admin tab UI modules
- `src/hooks/useFirestoreDoc.js` — reusable realtime document hook
- `src/hooks/useFirestoreCollection.js` — reusable realtime collection hook
- `src/services/adminService.js` — Firestore/Auth/Storage admin operations
- `src/components/Resume.js` — live resume rendering + PDF export
- `firestore.rules` — Firestore authorization/validation rules

For full architecture details see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Firestore Data Model

### Settings documents

- `settings/profile`
  - `name`, `bio`, `imageUrl`
  - optional arrays for legacy resume fallback: `specialization[]`, `education[]`, `awards[]`
- `settings/hero`
  - `imageUrl`
- `settings/resume`
  - `fileUrl`, `name`
- `settings/sectionVisibility`
  - per section flags: `{ showOnSite, showOnResume }`

### Collections

- `projects`
  - `title`, `category`, `imageUrl`, `link`, `order`, `createdAt`
- `skills`
  - `name`, `level`, `order`, `createdAt`
- `achievements`
  - `title`, `year`, `order`, `createdAt`
- `workExperience`
  - `title`, `period`, `company`, `order`, `createdAt`
- `specialization`, `education`, `awards`
  - `text`, `order`, `createdAt`
- `messages`
  - `name`, `email`, `message`, `createdAt`, `read`, `emailSent`, `emailResponse`, `emailError`
- `users`
  - user profile metadata, optional `isAdmin: true` for admin access

## Security Model

- Public read for portfolio content collections/docs
- Public create for `messages` with validation
- Admin-only write for content/settings/messages management
- Admin detection supports:
  - custom claim: `request.auth.token.admin == true`
  - fallback: `users/{uid}.isAdmin == true`

Deploy rules from `firestore.rules` whenever schema/validation changes.

## Environment Setup

Create `.env` in project root:

```env
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
```

Optional: Cloudinary (recommended for image hosting)

1. In Cloudinary, create an *unsigned* upload preset: Dashboard → Settings → Upload → Upload presets → Add preset → uncheck "Sign uploads".
2. Create a local env file (do NOT commit) `.env.local` and add:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

3. Restart the dev server (`npm start`). The admin UI will now upload images to Cloudinary (falls back to Firebase Storage if Cloudinary is not configured).

Use the provided `.env.example` as a template.

Server signing (recommended)

1. Create a folder `server/` (already added) and set server env vars (do NOT commit):

```
cd server
copy ..\.env.example ..\server\.env.local  (or manually create .env)
```

2. In `server/.env.local` set:

```
CLOUDINARY_API_KEY=937116636894453
CLOUDINARY_API_SECRET=-mcIgV9mFiCgh1SXDE7j9kgEeg4
CLOUDINARY_CLOUD_NAME=cmbtvqrs
```

3. Start the signing server:

```bash
cd server
npm install
npm start
```

4. Add `REACT_APP_CLOUDINARY_SIGNING_URL=http://localhost:5000` to your client `.env.local` and restart the React dev server.

With signing enabled the client will request a short-lived signature from the signing server and perform a signed upload to Cloudinary (more secure than unsigned uploads).

CI / GitHub Actions deploy

You can automate deploys to Firebase Hosting using GitHub Actions. The repository includes a workflow at `.github/workflows/firebase-hosting-deploy.yml` that builds the app and runs `firebase deploy` on pushes to `main`.

Setup steps:

1. In the repo on GitHub, add a repository secret named `FIREBASE_TOKEN`. Generate it locally with:

```bash
npx firebase-tools login:ci
```

2. Copy the generated token into the `FIREBASE_TOKEN` secret in GitHub Settings → Secrets.

3. Push to `main` — the action will build and deploy automatically.

Local deploy

1. Ensure you have the Firebase CLI installed:

```bash
npm install -g firebase-tools
```

2. Build the site:

```bash
npm ci
npm run build
```

3. Deploy to your Firebase project (the default project is set in `.firebaserc`):

```bash
firebase login
firebase deploy --only hosting
```

Notes

- Do NOT commit secrets (Cloudinary API secret or Firebase tokens) into the repository. Use environment variables or GitHub secrets.
- If you want the Cloudinary signing server deployed alongside the site, consider implementing it as a Firebase Function so it can be deployed within the same Firebase project. I can scaffold that if you'd like.

Notes:
- If EmailJS keys are missing, contact submissions are still saved to Firestore.
- Firebase Web config is loaded from `src/firebase.js`.

## Local Development

```bash
npm install
npm start
```

App runs at `http://localhost:3000`.

## Build

```bash
npm run build
```

Build output is generated in `build/`.

## Firebase Hosting

Configured project:
- `.firebaserc` default project: `naveedabbasdev`
- `firebase.json` public dir: `build/`

Deploy flow:

```bash
npm run build
firebase deploy
```

## Admin Access Setup

Grant admin with one of the following:

1. Firestore document
   - `users/<uid>` with `isAdmin: true`
2. Firebase Admin SDK custom claim
   - set `{ admin: true }` on user

After changing admin rights, sign out/in to refresh token/claims.

## Refactor Notes (Current)

Implemented improvements:
- Admin UI now composes modular tab components from `src/pages/Admin/*`
- Repeated Firestore listeners refactored into reusable hooks
- Firebase CRUD/upload logic centralized in `src/services/adminService.js`
- Public pages use shared hooks for consistent realtime behavior
