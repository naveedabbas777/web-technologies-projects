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
