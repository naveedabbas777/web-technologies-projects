# Render Deployment Guide

This project is already prepared for Render with a Blueprint at [render.yaml](render.yaml).

## What Render Creates

- Backend web service: `fresh-grocery-backend`
- Frontend static site: `fresh-grocery-frontend`

## Deploy Steps

1. Push this repository to GitHub.
2. Open Render and create a new Blueprint.
3. Select this repository.
4. Let Render read [render.yaml](render.yaml).
5. Create the services.

## Required Backend Environment Variables

Set these in the Render backend service:

- `MONGODB_URI` - your MongoDB Atlas connection string
- `JWT_SECRET` - a long random secret
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL` - your Render frontend URL, for example `https://fresh-grocery-frontend.onrender.com`
- `CORS_ORIGINS` - same frontend URL, or a comma-separated list if you have more than one

Optional:

- `REDIS_ENABLED=true`
- `REDIS_URL` if you want Redis caching on Render

## Required Frontend Environment Variable

Set this on the Render static site:

- `VITE_API_BASE=https://fresh-grocery-backend.onrender.com/api`

If your backend service name differs, replace the hostname accordingly.

## Important Notes

- Render static env vars are used at build time, so make sure `VITE_API_BASE` is set before the frontend build runs.
- The backend health check path is `/api/health`.
- The backend listens on Render port `10000` through the blueprint.

## After Deploy

1. Open the backend `/api/health` URL and confirm it returns success.
2. Open the frontend URL and sign in.
3. Verify products, orders, uploads, and messages.
