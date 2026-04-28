# Cloudinary Setup Guide for Fresh Grocery App

## Overview
Cloudinary is a cloud-based image management platform used for storing and serving product images and user profile avatars. Your app is configured to use Cloudinary for all image uploads.

---

## Your Current Cloudinary Account

**Cloud Name:** `dqsqbuoot`  
**API Key:** `93185389358985`  
**API Secret:** `your-cloudinary-api-secret`

These credentials are already configured in your `.env` file:
```
CLOUDINARY_CLOUD_NAME=dqsqbuoot
CLOUDINARY_API_KEY=93185389358985
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## Required Cloudinary Settings

### 1. **Folder Structure (Already Configured)**
The app automatically uploads images to these folders:
- **`grocery/products`** - All product images
- **`grocery/profiles`** - All user profile/avatar images

These folders are created automatically on first upload. No manual setup needed.

### 2. **Upload Settings to Check/Configure**

Go to **Cloudinary Dashboard > Settings > Upload**:

#### ✓ Unsigned Upload Mode (RECOMMENDED for security)
- Currently configured to use API-based uploads with server-side authentication
- This is more secure than unsigned uploads

#### ✓ File Size Limits
- **Current Limit:** 5MB per file
- **Product Images:** Max 5MB (large product photos)
- **Profile Avatars:** Max 1MB (enforced on frontend + backend)

#### ✓ Image Optimization
- Enable "Eager Transformations" if you want auto-resizing
- Example: Resize product images to 400x400 for thumbnails

---

## Troubleshooting Cloudinary Upload Issues

### Problem: "Image upload failed"

**Solution 1: Verify Credentials**
```bash
# From backend directory, test your credentials:
node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: 'dqsqbuoot',
    api_key: '93185389358985',
   api_secret: 'your-cloudinary-api-secret'
});
cloudinary.api.resources({max_results: 1})
    .then(res => console.log('✅ Credentials valid'))
    .catch(err => console.error('❌ Error:', err.message));
"
```

**Solution 2: Check File Upload Process**
1. Backend logs should show:
   - `📁 Uploading file from: /path/to/temp/file`
   - `📂 Target folder: grocery/products` or `grocery/profiles`
   - `✅ Upload successful: https://res.cloudinary.com/...`

2. If upload fails, look for error messages like:
   - "Cloudinary credentials are not configured"
   - "Invalid credentials"
   - "Network timeout"

**Solution 3: Check Image File Format**
- Allowed formats: JPEG, PNG, GIF, WebP
- File must actually be an image (not renamed text file)

---

## Image Upload Flow

### Product Image Upload:
1. Admin/Staff uploads image via file picker
2. Frontend validates: file type + size (5MB max)
3. Frontend sends FormData to backend
4. Backend Multer middleware validates again
5. Backend uploads to Cloudinary `grocery/products` folder
6. Backend stores secure URL in MongoDB
7. Product list displays thumbnail from Cloudinary URL

### User Avatar Upload:
1. User uploads avatar via Profile page
2. Frontend validates: file type + size (1MB max)
3. Frontend sends FormData to backend
4. Backend uploads to Cloudinary `grocery/profiles` folder
5. Backend stores secure URL in MongoDB `avatar` field
6. Profile picture displays from Cloudinary URL

---

## Backend Environment Variables

Make sure your `.env` file has these three lines:
```
CLOUDINARY_CLOUD_NAME=dqsqbuoot
CLOUDINARY_API_KEY=93185389358985
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Note About Security:
- Your API Key and Secret should NOT be exposed to frontend
- All Cloudinary uploads happen server-side (via backend)
- The frontend only sends files to your backend
- Your backend handles authentication with Cloudinary

---

## Changing/Resetting Cloudinary Credentials

If you ever need to reset your credentials:

1. Go to **Cloudinary Dashboard > Settings > API Keys**
2. Generate new API Key
3. Get new API Secret
4. Update your `.env` file
5. Restart backend server: `npm run dev`

---

## Monitoring Uploaded Images

1. **View Uploaded Files:**
   - Go to **Cloudinary Dashboard > Media Library**
   - Filter by folder name: "grocery"
   - You'll see `grocery/products` and `grocery/profiles`

2. **Check Image URLs:**
   - Each image gets a permanent URL like:
   - `https://res.cloudinary.com/dqsqbuoot/image/upload/v1234567890/grocery/products/image.jpg`
   - This URL never changes (perfect for database storage)

3. **Storage Usage:**
   - Go to **Settings > Account** to check your storage quota
   - Free tier allows up to 25GB total storage

---

## Best Practices

✓ **Do:**
- Always validate file type + size on frontend AND backend
- Use the secure_url from Cloudinary response (HTTPS)
- Store image URLs in database (not the image file)
- Organize images in folders (grocery/products, grocery/profiles)
- Use appropriate image dimensions for performance

✗ **Don't:**
- Expose API Secret to frontend
- Upload to Cloudinary without server-side authentication
- Store full image file in database (only store URL)
- Leave default Cloudinary config - always set environment variables

---

## Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid credentials" | Wrong API Key/Secret | Check .env file matches dashboard |
| "File too large" | File > 5MB | Client must select smaller file |
| "Invalid file type" | Upload non-image file | Only JPEG, PNG, GIF, WebP allowed |
| "Folder not found" | Folder doesn't exist | It auto-creates on first upload |
| "Network timeout" | Cloudinary unreachable | Check internet connection |
| "Upload failed (no error)" | Permission issue | Check API Key has upload permission |

---

## Testing the Setup

### Test Product Upload:
1. Login as Admin
2. Go to Products > Add New Product
3. Fill in: Name, Category, Price, Stock
4. Select an image file
5. Click Save
6. Check browser console for network activity
7. Check backend logs for upload confirmation
8. Verify product appears in list with image

### Test Avatar Upload:
1. Login as any user
2. Go to Profile
3. Click "Upload Avatar"
4. Select image (max 1MB)
5. Avatar should update immediately
6. Refresh page - avatar should still be there

---

## Advanced: Cloudinary Transformations

If you want to optimize images automatically, Cloudinary can resize/compress on the fly:

**Example: Auto-fit product images to 400x400:**
```
https://res.cloudinary.com/dqsqbuoot/image/upload/w_400,h_400,c_fill/v1234567890/grocery/products/image.jpg
```

**Example: Profile avatars with circular crop:**
```
https://res.cloudinary.com/dqsqbuoot/image/upload/w_150,h_150,c_fill,r_max/v1234567890/grocery/profiles/avatar.jpg
```

These can be applied in frontend image tags for better performance.

---

## Support & Troubleshooting

If products still aren't showing after upload:

1. **Check Backend Logs:**
   ```bash
   # Look for these patterns:
   ✅ Upload successful: https://res.cloudinary.com/...
   ✅ Product saved to database with ID: ...
   ```

2. **Check Database:**
   ```
   - Product should have `image_url` field populated
   - `image_url` should be a valid Cloudinary URL
   ```

3. **Check Frontend:**
   - Product list should display thumbnail
   - If no image shows, `image_url` is null or URL is broken

4. **Test Cloudinary URL Directly:**
   - Copy the image_url from database
   - Paste in browser address bar
   - Image should display (not 404)

---

**Last Updated:** April 2026  
**Version:** 1.0  
**Framework:** Express.js + React + Cloudinary v2
