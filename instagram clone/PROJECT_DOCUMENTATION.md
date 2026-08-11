# Project Documentation

This document provides a comprehensive overview of the Instagram-like clone project, covering both the backend and frontend components.

## 1. Project Overview

This project is a full-stack web application that mimics some of the core functionalities of Instagram. It allows users to register, log in, create and share image and video posts, comment on posts, like/dislike posts, and follow/unfollow other users. It also includes an admin role with privileges to manage users, posts, and comments.

## 2. Technologies Used

### 2.1. Backend

-   **Framework:** Express.js (Node.js)
-   **Database:** MongoDB with Mongoose ODM
-   **Authentication:** JWT (JSON Web Tokens) and session management with `express-session` and `connect-mongo`
-   **File Uploads:** `express-fileupload` for handling image and video uploads
-   **View Engine:** EJS (Embedded JavaScript templates) for server-side rendering of some pages
-   **Other Key Dependencies:**
    -   `bcryptjs`: For hashing passwords
    -   `cors`: For enabling Cross-Origin Resource Sharing
    -   `morgan`: For HTTP request logging
    -   `express-validator`: For input validation

### 2.2. Frontend

-   **Framework:** Angular (version 21)
-   **HTTP Client:** Angular's built-in `HttpClient` for making API requests to the backend
-   **Routing:** Angular Router for navigating between different components
-   **State Management:** RxJS (`BehaviorSubject`) and Angular Signals for managing user authentication state
-   **Styling:** CSS

## 3. Backend Architecture

The backend is a monolithic application built with Express.js.

### 3.1. Database Models

The application uses Mongoose to define the following data models:

-   **User:** Represents a user of the application. Stores information like username, email, hashed password, bio, profile picture, role (`user` or `admin`), and lists of followers and following users.
-   **Post:** Represents an image post. Contains a title, caption, a reference to the author (User), the image path, and arrays of likes and dislikes.
-   **VideoPost:** Represents a video post. Similar to the `Post` model, but stores a video path instead of an image path.
-   **Comment:** Represents a comment on a post. Contains the comment content, a reference to the author (User), and a reference to either a `Post` or a `VideoPost`.

### 3.2. API Endpoints

The backend exposes a RESTful API for the frontend to consume. Here's a summary of the main routes:

-   `/auth`: Handles user authentication (signup, login, logout).
-   `/posts`: Provides CRUD (Create, Read, Update, Delete) operations for image posts, as well as endpoints for liking and disliking posts.
-   `/videos`: Provides CRUD operations for video posts, and endpoints for liking and disliking them.
-   `/comments`: Allows creating and deleting comments on both image and video posts.
-   `/users`:
    -   Provides user profile information.
    -   Handles profile updates.
    -   Manages following and unfollowing users.
    -   Includes admin-only endpoints for managing users, posts, and comments.

### 3.3. Middleware

-   `auth.js`: Contains middleware to restrict access to authenticated users (`restrictToAuthenticated`) and admin users (`restrictToAdmin`).
-   `imageUpload.js` & `videoUpload.js`: Middleware for validating uploaded image and video files.
-   `logger.js`: Logs incoming requests.

## 4. Frontend Architecture

The frontend is a single-page application (SPA) built with Angular.

### 4.1. Components

The application is divided into several components, each responsible for a specific part of the UI:

-   **`auth`:** `LoginComponent` and `SignupComponent` for user authentication.
-   **`home`:** `HomeComponent` displays a feed of posts.
-   **`posts`:** Components for creating, viewing, and editing image posts (`PostNewComponent`, `PostDetailComponent`, `PostEditComponent`).
-   **`videos`:** Components for the video feed, creating, viewing, and editing video posts (`VideoFeedComponent`, `VideoNewComponent`, `VideoDetailComponent`, `VideoEditComponent`).
-   **`users`:** Components for user profiles (`UserProfileComponent`, `UserProfileEditComponent`) and viewing a user's own posts (`MyPostsComponent`).
-   **`admin`:** Components for admin functionalities like managing users, posts, and comments (`AdminUsersComponent`, `AdminPostsComponent`, `AdminCommentsComponent`, `AdminUserPostsComponent`, `AdminUserCommentsComponent`).
-   **`shared`:** Reusable components like the navbar and sidebar.

### 4.2. Services

Services are used to encapsulate business logic and data access, making the code more modular and reusable.

-   **`AuthService`:** Manages user authentication state, including login, signup, and logout. It uses RxJS and Angular Signals to provide the current user's authentication status and role to other parts of the application.
-   **`PostsService`:** Handles all HTTP requests related to image posts.
-   **`VideosService`:** Handles all HTTP requests related to video posts.
-   **`CommentsService`:** Manages creating and deleting comments.
-   **`UsersService`:** Interacts with user-related API endpoints, such as fetching profiles, updating profiles, and admin actions.

### 4.3. Routing and Guards

-   **`app.routes.ts`:** Defines the application's routes, mapping URLs to their corresponding components.
-   **`auth.guard.ts`:** Protects routes that require an authenticated user.
-   **`admin.guard.ts`:** Protects routes that are only accessible to admin users.

## 5. How to Run the Project

### 5.1. Backend

1.  Navigate to the `blogapi` directory.
2.  Install dependencies: `npm install`
3.  Make sure you have a MongoDB server running locally on `mongodb://127.0.0.1:27017`.
4.  Start the server: `npm start`
5.  The backend will be running on `http://localhost:8001`.

### 5.2. Frontend

1.  Navigate to the `instagram-clone-angular` directory.
2.  Install dependencies: `npm install`
3.  Start the development server: `ng serve`
4.  Open your browser and go to `http://localhost:4200`.