# Instagram Clone - Angular 21 Frontend

This is the Angular 21 frontend application for the Instagram Clone project. It connects to the existing Express.js backend API.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd instagram-clone-angular
   npm install
   ```

2. **Configure Backend URL**
   - The backend API URL is configured in the services (default: `http://localhost:3000`)
   - Make sure your Express backend is running on port 3000
   - Update the `apiUrl` in all service files if your backend runs on a different port

3. **Start Development Server**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:4200`

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

- `src/app/components/` - All Angular components
  - `auth/` - Login and Signup components
  - `posts/` - Post-related components (list, detail, create, edit)
  - `videos/` - Video-related components
  - `users/` - User profile components
  - `admin/` - Admin management components
  - `shared/` - Shared components (navbar, sidebar)

- `src/app/services/` - API service classes
  - `auth.service.ts` - Authentication service
  - `posts.service.ts` - Posts API service
  - `comments.service.ts` - Comments API service
  - `users.service.ts` - Users API service
  - `videos.service.ts` - Videos API service

- `src/app/guards/` - Route guards for authentication and authorization

- `src/app/interceptors/` - HTTP interceptors for session handling

## Features

- ✅ User authentication (login/signup)
- ✅ Post feed with infinite scroll
- ✅ Post creation and editing
- ✅ Comments on posts
- ✅ Like/unlike posts
- ✅ User profiles
- ✅ Video posts
- ✅ Admin panel (basic structure)
- ✅ Responsive design matching original UI

## Backend Connection

The Angular app connects to the existing Express backend using:
- Session-based authentication (cookies)
- HTTP requests with `withCredentials: true` to maintain sessions
- Same API endpoints as the original EJS frontend

## Notes

- The backend must be running and accessible at the configured URL
- CORS must be properly configured on the backend to allow requests from the Angular app
- Session cookies will be automatically sent with requests due to `withCredentials: true`

