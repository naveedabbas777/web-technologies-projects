# Fresh Grocery - Online Delivery Management System
# Complete Setup Guide

## 📋 Project Overview
This is a full-stack web application for online grocery shopping and delivery management built with modern technologies.

## 🏗️ Project Structure

```
mooen/
├── frontend-react/           # Frontend app (React + Vite)
│   ├── src/                  # React source code
│   ├── index.html            # Vite HTML entry
│   ├── vite.config.js        # Vite config
│   └── package.json          # Frontend dependencies
│
├── backend/                 # Backend server (Node.js)
│   ├── models/
│   │   ├── db.js           # Database connection
│   │   ├── User.js         # User model
│   │   ├── Product.js      # Product model
│   │   └── Order.js        # Order model
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── products.js     # Products API routes
│   │   └── orders.js       # Orders API routes
│   ├── config.js           # Configuration file
│   ├── server.js           # Main server file
│   ├── package.json        # Dependencies
│   └── .env.example        # Environment variables template
│
├── database/               # Database files
│   └── schema.sql          # MySQL database schema
│
└── README.md              # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MySQL (v5.7+)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd mooen/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env file with your database credentials:**
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=grocery_delivery_db
   PORT=5000
   ```

5. **Create database and import schema:**
   ```bash
   mysql -u root -p
   CREATE DATABASE grocery_delivery_db;
   USE grocery_delivery_db;
   SOURCE ../database/schema.sql;
   ```

6. **Start the server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to React frontend:**
   ```bash
   cd frontend-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the React dev server:**
   ```bash
   npm run dev
   ```

4. **Open the URL shown in the terminal** (typically `http://localhost:5173`)

## 📱 Features

### Customer Features
- ✅ User Registration & Login
- ✅ Browse Products by Category
- ✅ Search Products
- ✅ Add Products to Cart
- ✅ View Cart & Manage Items
- ✅ Checkout & Order Placement
- ✅ View Order History
- ✅ Track Order Status
- ✅ Responsive Design

### Admin Features
- ✅ Admin Dashboard
- ✅ Product Management (Add/Edit/Delete)
- ✅ Order Management
- ✅ Customer Management
- ✅ Delivery Tracking
- ✅ Revenue Reports

### Delivery Rider Features
- View Assigned Orders
- Update Delivery Status
- Access Delivery Map

## 🎨 UI/UX Highlights

- **Modern Design:** Beautiful gradient backgrounds and smooth animations
- **Responsive Layout:** Works perfectly on mobile, tablet, and desktop
- **Fast Loading:** Optimized images and lazy loading
- **Intuitive Navigation:** Easy to use interface
- **Accessibility:** Semantic HTML and ARIA labels
- **Dark Mode Ready:** Can be easily extended

## 🔐 Security Features

- JWT Token Authentication
- Password Hashing with Bcrypt
- CORS Protection
- Rate Limiting
- Input Validation & Sanitization
- SQL Injection Prevention

## 📊 Database Schema

### Tables
- **users** - Customer, Admin, and Delivery Rider accounts
- **products** - Grocery items catalog
- **cart** - Shopping cart items
- **orders** - Customer orders
- **order_items** - Items in each order
- **payments** - Payment transactions
- **delivery** - Delivery assignments
- **categories** - Product categories

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status (Admin)

## 🎯 Performance Optimization

- ✅ Lazy Loading for Images
- ✅ Minimized CSS & JavaScript
- ✅ Database Indexing
- ✅ Connection Pooling
- ✅ Caching Strategies
- ✅ Compressed Assets

## 📱 Browser Support

- Chrome (Latest)
- Firefox (Latest)
- Safari (Latest)
- Edge (Latest)

## 🐛 Testing

Run the application and test the following:

1. **User Registration** - Create new account
2. **Login** - Verify authentication
3. **Browse Products** - Check product display
4. **Search Functionality** - Test search
5. **Cart Operations** - Add/Remove items
6. **Checkout Process** - Complete order
7. **Admin Panel** - Test admin features

## 📝 Default Accounts

### Admin Account
- Email: `admin@freshgrocery.com`
- Password: `admin123`

### Test Customer Account
- Email: `customer@example.com`
- Password: `password123`

## 🚀 Deployment

### Frontend Deployment
- Use Vercel, Netlify, or GitHub Pages
- Build optimized production version

### Backend Deployment
- Use Heroku, AWS, or DigitalOcean
- Set up environment variables
- Configure database connection

### Deploy On Render (Backend + Frontend)

1. Push this repository to GitHub.
2. In Render, create a Blueprint and select this repo.
3. Render will detect `render.yaml` and create:
   - Web service: `fresh-grocery-backend`
   - Static site: `fresh-grocery-frontend`
4. Set backend environment variables in Render:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Render frontend URL)
   - `CORS_ORIGINS` (your Render frontend URL, comma-separated if multiple)
5. Set frontend environment variable:
   - `VITE_API_BASE` = `https://<your-backend-service>.onrender.com/api`

#### MongoDB Atlas Connection String Note

If your password contains special characters, URL-encode them.
Example password `Naveed@0788` must become `Naveed%400788`.

Example format:

`mongodb+srv://username:Naveed%400788@cluster0.dgcnw4s.mongodb.net/grocery_delivery_db?retryWrites=true&w=majority&appName=Cluster0`

## 📞 Support & Contact

- Email: info@freshgrocery.com
- Phone: +92-300-1234567
- Website: www.freshgrocery.com

## 👨‍💻 Developer

**M. Mueen (FA23-BSE-028)**
- Course: Software Construction & Development
- Instructor: Sania Iram
- University: FAST-NUCES

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Bootstrap 5 for responsive design
- FontAwesome for icons
- Express.js for backend framework
- MySQL for database
- JWT for authentication

---

**Last Updated:** March 2026
**Version:** 1.0.0
