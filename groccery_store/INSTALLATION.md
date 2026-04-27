# Fresh Grocery - System Requirements & Installation Guide

## 💻 System Requirements

### Minimum Requirements
- **OS:** Windows, macOS, or Linux
- **RAM:** 2 GB
- **Storage:** 500 MB
- **Internet:** Required for initial setup

### Recommended Requirements
- **OS:** Windows 10+ / macOS 10.14+ / Ubuntu 18.04+
- **RAM:** 4 GB+
- **Storage:** 1 GB+
- **Processor:** Dual-core or better

---

## 📦 Software Prerequisites

### Required
1. **Node.js** (v14+ recommended)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **MySQL Server** (v5.7+)
   - Download: https://dev.mysql.com/downloads/mysql/
   - Verify: `mysql --version`

3. **Git** (optional but recommended)
   - Download: https://git-scm.com/

4. **Text Editor or IDE**
   - VS Code recommended: https://code.visualstudio.com/
   - Or any text editor

### Recommended
- **Postman** (for API testing) - https://postman.com/
- **MySQL Workbench** (for database management) - https://dev.mysql.com/products/workbench/
- **VS Code Extensions:**
  - Live Server
  - Thunder Client or REST Client
  - MySQL extension

---

## 🔧 Installation Steps

### Step 1: Clone/Download Project
```bash
# Using Git
git clone <repository-url>
cd mooen

# Or just extract the ZIP file
```

### Step 2: Setup Database
```bash
# Start MySQL
mysql -u root -p

# Create database
CREATE DATABASE grocery_delivery_db;
USE grocery_delivery_db;

# Import schema
SOURCE ./database/schema.sql;

# Exit MySQL
exit;
```

### Step 3: Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file (Windows)
notepad .env

# Edit .env file (Mac/Linux)
nano .env
```

### Step 4: Configure Environment Variables
Edit `.env` file:
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=grocery_delivery_db
DB_PORT=3306
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
```

### Step 5: Start Backend Server
```bash
npm run dev
```
Expected output:
```
✅ Server running on port 5000
Environment: development
Database: localhost:3306/grocery_delivery_db
```

### Step 6: Start React Frontend (Vite)
```bash
cd frontend-react
npm install
npm run dev
```

Open the URL shown in the terminal (typically http://localhost:5173).

---

## ✅ Verification Steps

### Backend Verification
1. Open http://localhost:5000 in browser
2. Should see JSON response with server info
3. Check terminal for "✅ Server running" message

### Database Verification
```bash
mysql -u root -p
USE grocery_delivery_db;
SHOW TABLES;
# Should show 8 tables
SELECT COUNT(*) FROM products;
exit;
```

### Frontend Verification
1. Open frontend URL in browser
2. Page should load with navigation bar
3. Hero section should display
4. All links should work

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module 'express'"
**Solution:**
```bash
cd backend
npm install
```

### Issue 2: "Access denied for user 'root'"
**Solution:**
- Check MySQL is running
- Verify .env credentials match your MySQL setup
- Reset MySQL password if needed

### Issue 3: "Port 5000 already in use"
**Solution:**
```bash
# Option A: Use different port
# Edit .env and change PORT=5001

# Option B: Kill existing process (Mac/Linux)
lsof -i :5000 | xargs kill -9

# Option B: Kill existing process (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue 4: "CORS error"
**Solution:**
- Ensure backend is running
- Ensure frontend URL doesn't have typos
- Check browser console (F12) for exact error

### Issue 5: "Cannot GET /api/products"
**Solution:**
- Backend routes might not be activated
- Check server.js for route imports
- Verify database connection

---

## 🚀 Running the Application

### Development Mode
**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
# Use any server (Live Server, Python, Node, etc.)
```

### Testing Features
1. **Homepage** - Load and scroll
2. **Products** - Browse products page
3. **Search** - Test search functionality
4. **Cart** - Add items to cart
5. **Checkout** - Go through checkout process
6. **Login** - Register and login
7. **Orders** - View order history
8. **Admin** - Access admin dashboard

---

## 📱 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Full |
| Firefox | Latest | ✅ Full |
| Safari | Latest | ✅ Full |
| Edge | Latest | ✅ Full |
| IE 11 | - | ❌ Not supported |

---

## 🔐 Security Notes

1. **Never commit .env file** to Git
2. **Change JWT_SECRET** in production
3. **Use strong database passwords**
4. **Enable HTTPS** in production
5. **Keep Node.js and MySQL updated**

---

## 📊 Project Structure Verification

After setup, you should have:
```
✅ backend/node_modules/    (installed)
✅ backend/.env             (created)
✅ backend/package.json     (present)
✅ frontend/index.html      (present)
✅ database/schema.sql      (present)
✅ All other files/folders  (present)
```

---

## 🎯 First Run Checklist

- [ ] Node.js installed and verified
- [ ] MySQL installed and running
- [ ] Database created
- [ ] Schema imported
- [ ] .env file configured
- [ ] npm dependencies installed
- [ ] Backend server running
- [ ] Frontend accessible
- [ ] Can browse products
- [ ] Can login/register

---

## 📞 Getting Help

If you encounter issues:

1. **Check Documentation**
   - README.md
   - QUICKSTART.md
   - INTEGRATION_GUIDE.md

2. **Check Browser Console**
   - Open in browser: F12
   - Go to Console tab
   - Look for error messages

3. **Check Terminal Output**
   - Watch backend terminal for error messages
   - Note any red/error text

4. **Verify Prerequisites**
   - `node --version` (should show version)
   - `mysql --version` (should show version)
   - `npm --version` (should show version)

5. **Test Connectivity**
   - Test MySQL: `mysql -u root -p -e "SELECT 1;"`
   - Test Backend API: Open http://localhost:5000
   - Test Database: Check tables exist

---

## ✨ Success Indicators

You'll know it's working when:
1. ✅ Backend shows "Server running on port 5000"
2. ✅ Frontend loads with beautiful UI
3. ✅ Products display on products page
4. ✅ Search works
5. ✅ Can add items to cart
6. ✅ Cart updates in real-time
7. ✅ Login/Register pages work
8. ✅ Admin dashboard loads

---

## 🚀 Ready to Deploy?

When you're ready for production:
1. Update all passwords
2. Set NODE_ENV=production in .env
3. Configure your hosting
4. Deploy frontend to CDN/hosting
5. Deploy backend to server
6. Set up database backups
7. Configure SSL/HTTPS
8. Monitor performance

---

## 🎓 Learning Resources

- **Node.js:** https://nodejs.org/docs/
- **Express.js:** https://expressjs.com/
- **MySQL:** https://dev.mysql.com/doc/
- **Bootstrap:** https://getbootstrap.com/docs/
- **JavaScript:** https://javascript.info/

---

**Version:** 1.0.0  
**Last Updated:** March 2026  
**Status:** Ready for Use  

🎉 **All set! Start building!**
