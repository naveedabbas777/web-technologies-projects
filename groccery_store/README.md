# Fresh Grocery - Online Delivery Management System

Full-stack grocery shopping and delivery platform built with React, Vite, Node.js, Express, MongoDB, Socket.IO, and optional Cloudinary/Redis integrations.

## Overview

This repository contains a customer-facing grocery storefront, admin and staff dashboards, a realtime messaging layer, and a production deployment blueprint for Render.

The codebase is MongoDB-first. Some older markdown files in the repo still mention MySQL and SQL schema files; the runtime code uses Mongoose models and MongoDB services instead.

## Tech Stack

- Frontend: React 18, Vite, React Router, Chart.js, Socket.IO client
- Backend: Node.js, Express, Socket.IO, Mongoose, JWT, bcryptjs, multer
- Optional services: Cloudinary for image uploads, Redis for caching, Nodemailer for email, Stripe/payment hooks
- Deployment: Render Blueprint via `render.yaml`

## Key Features

### Customer

- Browse products with search and category filtering
- Manage cart and checkout flow
- Place orders and view order history
- Receive realtime updates through Socket.IO

### Admin

- Product CRUD with image upload support
- Order management and status updates
- Customer management
- Dashboard charts and operational views

### Staff and Rider

- Role-based dashboards and message inboxes
- Delivery and order workflow support

## Repository Structure

```text
groccery_store/
├── backend/
│   ├── server.js
│   ├── config.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
├── frontend-react/
│   ├── src/
│   ├── vite.config.js
│   └── package.json
├── render.yaml
└── docs (*.md)
```

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB Atlas or another reachable MongoDB instance
- Optional: Cloudinary account for uploads

## Local Setup

### 1. Clone the repo

```bash
git clone <your-github-repo-url>
cd groccery_store
```

### 2. Configure the backend

Create `backend/.env` and set at least:

```env
NODE_ENV=development
PORT=5000
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRY=7d
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

Optional backend settings:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REDIS_ENABLED=false
REDIS_URL=
```

### 3. Install and run the backend

```bash
cd backend
npm install
npm run dev
```

The server should start on `http://localhost:5000`.

### 4. Install and run the frontend

```bash
cd ../frontend-react
npm install
npm run dev
```

The frontend should open on the Vite dev URL, usually `http://localhost:5173`.

## Production Build

### Frontend

```bash
cd frontend-react
npm install
npm run build
```

### Backend

```bash
cd backend
npm install
npm start
```

## Render Deployment

This repo already includes a Render Blueprint in `render.yaml`.

### Services Render creates

- Web service: `fresh-grocery-backend`
- Static site: `fresh-grocery-frontend`

### Deploy steps

1. Push the repo to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Let Render read `render.yaml` and create both services.
4. Add backend environment variables in Render.
5. Set `VITE_API_BASE` on the frontend static site.
6. Trigger a deploy and check the logs.

### Backend environment variables for Render

Set these on the backend service:

- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `CLOUDINARY_CLOUD_NAME` if you use image uploads
- `CLOUDINARY_API_KEY` if you use image uploads
- `CLOUDINARY_API_SECRET` if you use image uploads
- `REDIS_ENABLED` and `REDIS_URL` if you use Redis

### Frontend environment variables for Render

- `VITE_API_BASE=https://<your-backend-service>.onrender.com/api`

## Useful Scripts

### Backend

```bash
npm run dev
npm start
npm test
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## API Overview

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Products

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Orders

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/my-orders`
- `PUT /api/orders/:id`

### Messages and Support

- Message inbox, threaded conversations, and reply endpoints are exposed through the frontend service layer and backed by the backend message controllers.

## Important Notes

- The backend uses MongoDB, not MySQL.
- `render.yaml` is the source of truth for Render deployment.
- If product image uploads fail, check Cloudinary env vars first.
- If frontend API calls fail in production, confirm `VITE_API_BASE` points to the deployed backend URL with `/api`.
- CORS issues usually mean `CORS_ORIGINS` does not match the deployed frontend hostname exactly.

## Troubleshooting

- Backend fails to start: verify `MONGODB_URI` and `JWT_SECRET`.
- Frontend shows blank data: verify `VITE_API_BASE` and backend health.
- Upload errors: verify Cloudinary credentials or switch to non-upload product creation.
- Socket realtime not working: verify backend and frontend are both running on the deployed URLs.

## Project Information

- Author: M. Mueen
- License: ISC
- Version: 1.0.0

## Source Docs Consolidated

This README consolidates the useful parts of:

- `PROJECT_SUMMARY.md`
- `PROJECT_COMPLETION.md`
- `QUICKSTART.md`
- `INSTALLATION.md`
- `RENDER_DEPLOYMENT.md`
- `BACKEND_COMPLETE.md`
- `INTEGRATION_GUIDE.md`
- `PRODUCT_UPLOAD_FIX.md`
- `MONGODB_ATLAS_SETUP.md`
- `MONGODB_ATLAS_QUICK_START.md`
- `RUNNING.md`

## Last Updated

April 2026
