# MongoDB Atlas Quick Start

## TL;DR - Quick Setup

### Step 1: Create MongoDB Atlas Cluster (5 min)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Click "Create" → Select "M0 (Free)" tier
4. Wait for cluster to be created (shows "Active")

### Step 2: Create Database User (2 min)
1. Left sidebar → "Database Access"
2. Click "Add New Database User"
3. Username: `grocery_admin`
4. Click "Autogenerate Secure Password" (save the password!)
5. Click "Add User"

### Step 3: Whitelist Your IP (1 min)
1. Left sidebar → "Network Access"
2. Click "Add IP Address"
3. Select "Add Current IP"
4. Click "Confirm"

### Step 4: Get Connection String (2 min)
1. Go to "Clusters" → Click "Connect"
2. Choose "Drivers" → "Node.js"
3. Copy the connection string shown

### Step 5: Update .env File (1 min)
Replace this line in `backend/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/grocery_delivery_db
```

With your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://grocery_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/grocery_delivery_db?retryWrites=true&w=majority
```

Replace:
- `YOUR_PASSWORD` with the password you generated
- `cluster0.xxxxx` with your actual cluster connection details

### Step 6: Test Connection (2 min)
```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
   Host: cluster0.xxxxx.mongodb.net
   Database: grocery_delivery_db
```

✅ **Done!** Your app now uses MongoDB Atlas!

---

## Troubleshooting

**Error: "authentication failed"**
→ Check username/password in `.env`, verify in MongoDB Atlas Database Access

**Error: "IP not whitelisted"**
→ Go to Network Access and add your current IP address

**Error: "connection timeout"**
→ Check internet connection, verify IP whitelist, try different region

**Password has special characters (@, #, !)**
→ URL-encode in connection string, or use password with only alphanumeric characters

---

## Important Security Notes

⚠️ **Never share your `.env` file**
⚠️ **Don't commit `.env` to Git** (should be in .gitignore)
⚠️ **Keep your MongoDB Atlas password secure**
⚠️ **For production, use strong passwords** (20+ characters)

---

## Need Help?

See detailed guide: `MONGODB_ATLAS_SETUP.md`
