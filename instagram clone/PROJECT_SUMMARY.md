# Instagram Clone - Project Summary

## 📋 Project Overview

This is a full-stack Instagram-like social media application with a complete frontend and backend implementation.

---

## 🎨 Frontend Technology

### **Language & Framework:**
- **TypeScript** (Programming Language)
- **Angular 21** (Framework)
- **HTML5** (Markup)
- **CSS3** (Styling)

### **Frontend Architecture:**
- **Standalone Components** (Angular 21 modern approach)
- **Component-based architecture**
- **Service-oriented design**
- **Reactive programming** (RxJS)

### **Key Frontend Features:**
- Single Page Application (SPA)
- Client-side routing
- HTTP client for API communication
- Session-based authentication
- File uploads (images & videos)
- Infinite scroll
- Real-time search with debouncing

---

## ⚙️ Backend Technology

### **Language & Framework:**
- **JavaScript (Node.js)** (Programming Language)
- **Express.js** (Web Framework)
- **EJS** (Template Engine - Original Frontend)

### **Backend Architecture:**
- **RESTful API**
- **MVC Pattern** (Models, Views, Controllers)
- **Session-based authentication**
- **File upload handling**

### **Database:**
- **MongoDB** (NoSQL Database)
- **Mongoose** (ODM - Object Document Mapper)

### **Key Backend Features:**
- REST API endpoints
- Session management
- File storage (images & videos)
- User authentication & authorization
- Admin panel support
- Database operations (CRUD)

---

## 📁 Project Structure

```
lab mid/
├── blogapi/                          # Backend (Express.js + MongoDB)
│   ├── app.js                        # Main Express application
│   ├── routes/                       # API routes
│   │   ├── auth.js                  # Authentication routes
│   │   ├── posts.js                 # Post routes
│   │   ├── comments.js              # Comment routes
│   │   ├── users.js                 # User routes
│   │   ├── videos.js               # Video routes
│   │   └── index.js                # Home/index routes
│   ├── models/                      # MongoDB models
│   │   ├── User.js                 # User model
│   │   ├── Post.js                 # Post model
│   │   ├── Comment.js              # Comment model
│   │   └── VideoPost.js           # Video post model
│   ├── middleware/                  # Express middleware
│   │   ├── auth.js                # Authentication middleware
│   │   ├── imageUpload.js       # Image upload validation
│   │   └── videoUpload.js       # Video upload validation
│   ├── views/                       # EJS templates (Original Frontend)
│   │   ├── home.ejs
│   │   ├── auth_login.ejs
│   │   ├── post.ejs
│   │   └── ... (15+ EJS templates)
│   └── public/                      # Static files
│       ├── images/                 # Uploaded images
│       ├── videos/                 # Uploaded videos
│       └── stylesheets/style.css  # Original CSS
│
└── instagram-clone-angular/        # Frontend (Angular 21)
    ├── src/
    │   ├── app/
    │   │   ├── components/         # Angular components
    │   │   │   ├── auth/          # Login, Signup
    │   │   │   ├── posts/         # Post components
    │   │   │   ├── videos/        # Video components
    │   │   │   ├── users/         # User components
    │   │   │   ├── admin/         # Admin components
    │   │   │   └── shared/       # Navbar, Sidebar
    │   │   ├── services/           # API services
    │   │   │   ├── auth.service.ts
    │   │   │   ├── posts.service.ts
    │   │   │   ├── comments.service.ts
    │   │   │   ├── users.service.ts
    │   │   │   └── videos.service.ts
    │   │   ├── guards/            # Route guards
    │   │   ├── interceptors/      # HTTP interceptors
    │   │   └── app.routes.ts      # Routing configuration
    │   └── styles.css             # Global styles (copied from original)
    └── package.json              # Angular dependencies
```

---

## 🔧 Technology Stack Summary

### **Frontend:**
| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | 5.5.0 | Programming language |
| **Angular** | 21.0.0 | Frontend framework |
| **RxJS** | 7.8.0 | Reactive programming |
| **HTML5** | - | Markup |
| **CSS3** | - | Styling |

### **Backend:**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | - | Runtime environment |
| **JavaScript** | ES6+ | Programming language |
| **Express.js** | 4.16.1 | Web framework |
| **MongoDB** | - | Database |
| **Mongoose** | 8.6.3 | ODM for MongoDB |
| **EJS** | 3.1.10 | Template engine (original frontend) |

### **Additional Tools:**
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **express-fileupload** - File upload handling
- **Font Awesome** - Icons

---

## 🎯 Application Features

### **User Features:**
- ✅ User registration & login
- ✅ Create, edit, delete posts (with images)
- ✅ Create, edit, delete video posts
- ✅ Like/unlike posts and videos
- ✅ Comment on posts and videos
- ✅ User profiles with bio and profile picture
- ✅ Follow/unfollow users
- ✅ View user's posts and videos
- ✅ Search posts and videos
- ✅ Infinite scroll feed

### **Admin Features:**
- ✅ Manage all users
- ✅ Update user roles (user/admin)
- ✅ Manage all posts
- ✅ Manage all comments
- ✅ View user-specific posts
- ✅ View user-specific comments
- ✅ Delete any post or comment

---

## 🔌 API Communication

### **Connection:**
- Frontend runs on: `http://localhost:4200`
- Backend runs on: `http://localhost:3000`
- Communication: HTTP REST API
- Authentication: Session-based (cookies)

### **API Endpoints Used:**
- `GET /` - Home feed
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /auth/logout` - User logout
- `GET /posts/:id` - Get post details
- `POST /posts/new` - Create post
- `POST /posts/:id/edit` - Update post
- `POST /posts/:id/delete` - Delete post
- `POST /posts/:id/like` - Like post
- `GET /videos` - Video feed
- `POST /videos/new` - Create video
- `GET /users/profile` - Get user profile
- `POST /users/:id/follow` - Follow user
- `POST /users/:id/unfollow` - Unfollow user
- And many more...

---

## 📊 Project Statistics

- **Total Components:** 20 Angular components
- **Total Services:** 5 Angular services
- **Total Routes:** 17 routes
- **Backend Routes:** 30+ API endpoints
- **Database Models:** 4 (User, Post, Comment, VideoPost)
- **Pages:** 15+ pages/views

---

## 🚀 How to Run

### **Backend:**
```bash
cd blogapi
npm install
npm start
# Runs on http://localhost:3000
```

### **Frontend:**
```bash
cd instagram-clone-angular
npm install
npm start
# Runs on http://localhost:4200
```

---

## 📝 Summary

**Frontend Language:** TypeScript with Angular 21 framework  
**Backend Language:** JavaScript (Node.js) with Express.js framework  
**Database:** MongoDB (NoSQL)  
**Architecture:** Full-stack web application with REST API

The project has been successfully converted from an EJS server-side rendered application to a modern Angular 21 single-page application while maintaining all functionality and UI/UX design.

