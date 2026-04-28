# Fresh Grocery - Quick Start Guide

## 🚀 Quick Installation (5 minutes)

### Step 1: Setup Database
```bash
# Open MySQL
mysql -u root -p

# Create database
CREATE DATABASE grocery_delivery_db;
USE grocery_delivery_db;

# Import schema
SOURCE database/schema.sql;

# Exit MySQL
exit;
```

### Step 2: Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database details
# Then start the server
npm run dev
```

Server runs at: http://localhost:5000

### Step 3: Run Frontend
```bash
cd frontend-react
npm install
npm run dev
```

Frontend runs at: http://localhost:5173 (default Vite port)

---

## 📱 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@freshgrocery.com | admin123 |
| Customer | customer@example.com | password123 |
| Rider | rider@freshgrocery.com | rider123 |

---

## 🎯 Key Features

### ✅ Implemented Features

**Frontend:**
- [x] Responsive Home Page with Hero Section
- [x] Product Listing & Search
- [x] Category Filtering
- [x] Shopping Cart Management
- [x] User Login/Register
- [x] Checkout Process
- [x] Admin Dashboard
- [x] Beautiful UI with Animations
- [x] Mobile Responsive Design

**Backend:**
- [x] RESTful API Architecture
- [x] JWT Authentication
- [x] Database Models (User, Product, Order)
- [x] Product Management Routes
- [x] Order Processing Routes
- [x] Error Handling & Validation

**Database:**
- [x] MySQL Schema with 8 tables
- [x] Proper Indexing
- [x] Foreign Key Relationships
- [x] Cascade Delete Rules

---

## 📁 File Structure

```
mooen/
├── frontend-react/
│   ├── src/                    ← React app source
│   ├── index.html              ← Vite entry
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── server.js               ← Main server
│   ├── config.js               ← Configuration
│   ├── package.json            ← Dependencies
│   ├── .env.example            ← Environment vars
│   ├── models/
│   │   ├── db.js               ← Database connection
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   └── routes/
│       ├── auth.js
│       ├── products.js
│       └── orders.js
│
├── database/
│   ├── schema.sql              ← Database schema
│   └── sample-data.js          ← Sample data
│
└── README.md                   ← This file
```

---

## 🔧 Troubleshooting

### Issue: Database Connection Failed
**Solution:** 
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Issue: Backend Port Already in Use
**Solution:**
- Change PORT in `.env` file
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

### Issue: CORS Error
**Solution:**
- Ensure backend server is running
- Check `FRONTEND_URL` in backend `.env`

### Issue: Frontend Not Loading Products
**Solution:**
- Check browser console for errors (F12)
- Ensure backend is running on http://localhost:5000
- Verify API endpoints are accessible

---

## 🎨 UI/UX Highlights

- **Modern Design:** Purple gradient theme with smooth animations
- **Responsive Layouts:** Works on phone, tablet, desktop
- **Beautiful Cards:** Hover effects and smooth transitions
- **Fast Performance:** Optimized loading and smooth scrolling
- **Accessibility:** Proper HTML structure and ARIA labels

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register      - Create account
POST   /api/auth/login         - Login user
GET    /api/auth/me            - Get user profile
```

### Products
```
GET    /api/products           - All products
GET    /api/products/:id       - Product details
GET    /api/products/category/:cat  - By category
GET    /api/products/search/:q - Search
POST   /api/products           - Add product (admin)
PUT    /api/products/:id       - Edit product (admin)
DELETE /api/products/:id       - Delete product (admin)
```

### Orders
```
POST   /api/orders             - Create order
GET    /api/orders/my-orders   - User orders
GET    /api/orders/:id         - Order details
PUT    /api/orders/:id         - Update status (admin)
```

---

## 💡 Tips

1. **Development Mode:** Use `npm run dev` for auto-reload
2. **Testing:** Create test accounts while logged out
3. **Admin Access:** Use admin account to manage products
4. **Cart Data:** Stored in localStorage (survives page refresh)
5. **Responsive Design:** Test on mobile using DevTools (F12)

---

## 🚀 Production Deployment

### Frontend
```bash
# Build for production
npm build

# Deploy to Vercel/Netlify
# Or upload to web server
```

### Backend
1. Set up on cloud server (Heroku, AWS, etc.)
2. Configure environment variables
3. Point frontend to production API URL
4. Set up HTTPS/SSL certificate
5. Configure database backups

---

## 📞 Need Help?

- Check the README.md for detailed documentation
- Review console errors (F12 → Console tab)
- Check backend logs in terminal
- Verify database connections

---

## 📝 Project Info

**Student:** M. Mueen (FA23-BSE-028)  
**Course:** Software Construction & Development  
**Instructor:** Sania Iram  
**University:** FAST-NUCES  
**Date:** March 2026  
**Version:** 1.0.0

---

## ✨ Features to Add (Future)

- [ ] Payment gateway integration (Stripe/JazzCash)
- [ ] Email notifications
- [ ] Real-time order tracking
- [ ] User reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced filtering
- [ ] Mobile app version
- [ ] Analytics dashboard
- [ ] Automated invoice generation
- [ ] Subscription orders

---

**Happy Coding! 🎉**
