# Architecture Document

## 1) System Overview

This repository is a single-page React application backed by Firebase services:
- **Auth**: Admin login and identity
- **Firestore**: Portfolio content + contact messages
- **Storage**: Uploaded media/PDF assets
- **Hosting**: Static hosting for built SPA

The app has two major surfaces:
1. **Public portfolio**: read-only presentation of content
2. **Admin panel**: authenticated CRUD management of content

## 2) Runtime Flow

1. `src/index.js` mounts `App`.
2. `src/App.js` subscribes to auth state and renders routes.
3. Route `/admin` renders `Admin` if user is signed in, otherwise `Login`.
4. Public pages and layout subscribe to Firestore through shared hooks.
5. Admin writes data via service functions in `src/services/adminService.js`.

## 3) Layering

### UI Layer

- **Pages**: route-level screens in `src/pages/*`
- **Layout**: navigation/footer/background in `src/components/layout/*`
- **Admin tabs**: modular tab UIs in `src/pages/Admin/*`

### Hook Layer

- `src/hooks/useFirestoreDoc.js`
  - reusable realtime document subscription
- `src/hooks/useFirestoreCollection.js`
  - reusable realtime collection subscription with optional ordering/limit

### Service Layer

- `src/services/adminService.js`
  - admin checks (`custom claims` or `users/{uid}.isAdmin`)
  - CRUD helpers
  - ordering helpers
  - Storage upload helper

## 4) Firestore Schema

### settings/profile
- `name: string`
- `bio: string`
- `imageUrl: string`
- optional legacy arrays:
  - `specialization: string[]`
  - `education: string[]`
  - `awards: string[]`

### settings/hero
- `imageUrl: string`

### settings/resume
- `fileUrl: string`
- `name: string`

### settings/sectionVisibility
- `skills: { showOnSite: boolean, showOnResume: boolean }`
- `achievements: { showOnSite: boolean, showOnResume: boolean }`
- `projects: { showOnSite: boolean, showOnResume: boolean }`
- `workExperience: { showOnSite: boolean, showOnResume: boolean }`
- `specialization: { showOnSite: boolean, showOnResume: boolean }`
- `education: { showOnSite: boolean, showOnResume: boolean }`
- `awards: { showOnSite: boolean, showOnResume: boolean }`

### projects (collection)
- `title: string`
- `category: string | null`
- `imageUrl: string | null`
- `link: string | null`
- `order: number`
- `createdAt: timestamp`

### skills (collection)
- `name: string`
- `level: string | null`
- `order: number`
- `createdAt: timestamp`

### achievements (collection)
- `title: string`
- `year: string | number | null`
- `order: number`
- `createdAt: timestamp`

### workExperience (collection)
- `title: string`
- `period: string | null`
- `company: string | null`
- `order: number`
- `createdAt: timestamp`

### specialization / education / awards (collections)
- `text: string`
- `order: number`
- `createdAt: timestamp`

### messages (collection)
- `name: string`
- `email: string`
- `message: string`
- `createdAt: timestamp`
- `read: boolean`
- `emailSent: boolean`
- `emailResponse: string | null`
- `emailError: string | null`

### users (collection)
- `photoURL: string | null`
- `isAdmin: boolean` (privileged flag)

## 5) Access Control

Defined in `firestore.rules`:
- Public reads for portfolio content/settings
- Public `create` on `messages` with field validation
- Admin-only writes on content/settings/messages management
- `users/{uid}.isAdmin` guarded against non-admin client escalation

## 6) Admin Composition

`src/components/Admin.js` orchestrates:
- auth/admin validation
- shared status/loading/upload state
- firestore subscriptions via hooks
- mutation handlers via service layer

Rendered tab modules:
- `AdminProfileTab`
- `AdminHeroTab`
- `AdminProjectsTab`
- `AdminAchievementsTab`
- `AdminSkillsTab`
- `AdminWorkExperienceTab`
- `AdminResumeSectionsTab`
- `AdminMessagesTab`

## 7) File-by-File Responsibilities (Key)

- `src/firebase.js`: Firebase app/service initialization
- `src/App.js`: routes + auth gate
- `src/pages/Login.js`: admin sign-in + reset password
- `src/pages/Hero.js`: homepage content aggregation
- `src/pages/About.js`: skills/specialization/education/awards presentation
- `src/pages/Projects.js`: projects catalog
- `src/pages/Contact.js`: EmailJS + message persistence
- `src/components/Resume.js`: dynamic resume + PDF export
- `src/components/layout/Navbar.js`: top nav + site profile identity
- `src/components/layout/Footer.js`: footer + resume external link

## 8) Environment & Deployment

Required env for EmailJS:
- `REACT_APP_EMAILJS_SERVICE_ID`
- `REACT_APP_EMAILJS_TEMPLATE_ID`
- `REACT_APP_EMAILJS_PUBLIC_KEY`

Hosting/deploy:
- `firebase.json` serves `build/`
- `.firebaserc` default project: `naveedabbasdev`

## 9) Known Constraints

- Resume export depends on DOM rendering via `html2canvas` and may vary by browser.
- Firestore ordering relies on `order` field consistency.
- Admin rights require either token claim refresh or re-login after role changes.
