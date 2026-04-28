# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account & Cluster

### 1.1 Sign Up / Login
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Sign up with email or Google account (or login if existing account)
- Complete email verification if needed

### 1.2 Create Your First Cluster
1. Click **"Create"** to build a new cluster
2. Select **Deployment**: Choose **M0 (Free)** tier (suitable for development/testing)
3. Select **Cloud Provider**: AWS, Azure, or GCP (choose nearest to you)
4. Select **Region**: Pick a region close to your location
5. Click **"Create Deployment"**
6. Wait 3-5 minutes for cluster creation (status shows "Active")

### 1.3 Create Database User
1. In left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. **Authentication Method**: Select "Password"
4. **Username**: `grocery_admin` (or your preferred name)
5. **Password**: Click "Autogenerate Secure Password" and save it
6. **Database User Privileges**: Select "Read and write to any database"
7. Click **"Add User"**

**Important**: Save your username and password securely - you'll need them for the connection string!

### 1.4 Whitelist Your IP Address
1. In left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Choose one:
   - **Add Current IP**: Click this to automatically add your current IP
   - **Allow Access from Anywhere**: Add `0.0.0.0/0` (only for development)
4. Add optional description: "Development Machine"
5. Click **"Confirm"**

## Step 2: Get Connection String

### 2.1 Copy Connection String
1. Go to **"Clusters"** tab
2. Click **"Connect"** button next to your cluster
3. Select **"Drivers"** connection method
4. Choose **Driver: Node.js**
5. Select **Version: 4.x or later**
6. Copy the connection string shown

**Connection String Format**:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority
```

### 2.2 Replace Placeholders
- Replace `username` with your database user (e.g., `grocery_admin`)
- Replace `password` with your password (URL-encode special characters)
- Replace `database_name` with `grocery_delivery_db`

**Example**:
```
mongodb+srv://grocery_admin:MySecurePass123@cluster0.abc123.mongodb.net/grocery_delivery_db?retryWrites=true&w=majority
```

## Step 3: Update Backend Configuration

### 3.1 Update .env File
Edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000
DATABASE_TYPE=mongodb

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://grocery_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/grocery_delivery_db?retryWrites=true&w=majority

JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRY=7d
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=60000

FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
API_URL=http://localhost:5000

# Cloudinary
CLOUDINARY_CLOUD_NAME=dqsqbuoot
CLOUDINARY_API_KEY=931185389358985
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 3.2 Important Security Notes
⚠️ **Never commit `.env` file to version control**
- Password should be URL-encoded if it contains special characters
- Use only the MongoDB Atlas connection string (not local MongoDB)

## Step 4: Update MongoDB Connection Code

The existing `backend/models/mongodb.js` already supports MongoDB Atlas. No code changes needed - it will automatically use the `MONGODB_URI` from `.env`.

The connection string format `mongodb+srv://...` is automatically handled by mongoose.

## Step 5: Test Connection

### 5.1 Start Backend Server
```bash
cd backend
npm install  # Install dependencies if needed
npm run dev  # Start development server
```

### 5.2 Expected Output
```
✅ MongoDB connected successfully
   Host: cluster0.xxxxx.mongodb.net
   Database: grocery_delivery_db
```

### 5.3 If Connection Fails
Check:
- ✅ Username and password are correct in `.env`
- ✅ IP address is whitelisted in Network Access
- ✅ Connection string format is correct
- ✅ Internet connection is active
- ✅ Special characters in password are URL-encoded

## Step 6: Populate Initial Data (Optional)

If you want to seed sample data:

```bash
cd backend
npm run seed  # Runs seed.js to populate initial data
```

This creates:
- Sample users (admin, customer, staff, rider)
- Sample products (fruits, vegetables, meat, dairy)
- Sample orders
- Sample categories

## Step 7: View Data in MongoDB Atlas

### 7.1 Browse Collections
1. Go to **"Clusters"** → Click on your cluster name
2. Click **"Browse Collections"**
3. Select **Database**: `grocery_delivery_db`
4. View all collections and documents

### 7.2 Create Index (Optional)
For better performance, you can create indexes on frequently queried fields. The seed script handles this automatically.

## Troubleshooting

### Connection Timeout
- **Cause**: IP not whitelisted or network issue
- **Solution**: Add your IP in Network Access → Add IP Address

### Authentication Failed
- **Cause**: Wrong username/password
- **Solution**: Check `.env` file, verify credentials in MongoDB Atlas

### Database Not Found
- **Cause**: Connection string has wrong database name
- **Solution**: Update `MONGODB_URI` to use `grocery_delivery_db`

### Special Characters in Password
- **Cause**: Password contains @, #, !, etc.
- **Solution**: URL-encode password in connection string
  - @ → %40
  - # → %23
  - ! → %21
  - Use online URL encoder if needed

## Production Considerations

For production deployment:

1. **Use M2 or Higher Tier**: Free tier has limitations on connections/storage
2. **Enable Backup**: In Backup settings, enable automated backups
3. **Set Appropriate IP Whitelist**: Don't use `0.0.0.0/0` in production
4. **Use Environment Variables**: Keep credentials in secure environment variables
5. **Enable Encryption**: Use TLS/SSL (enabled by default)
6. **Monitor Performance**: Use MongoDB Atlas monitoring dashboard
7. **Set Up Alerts**: Configure alerts for CPU, memory, and connection issues

## Comparing Local vs Atlas

| Feature | Local MongoDB | MongoDB Atlas |
|---------|--------------|---------------|
| **Setup Time** | Quick (~5 min) | ~15 min |
| **Cost** | Free (local hardware) | Free tier available |
| **Availability** | Only on your machine | Cloud-hosted (99.95% uptime) |
| **Backup** | Manual | Automated |
| **Scalability** | Limited | Highly scalable |
| **Performance** | Depends on local hardware | Optimized cloud infrastructure |
| **Security** | Network isolated | Enterprise-grade security |
| **Access** | Localhost only | Accessible from anywhere (if whitelisted) |

## Migration from Local to Atlas

If you have existing data in local MongoDB:

1. **Export data** (optional):
   ```bash
   mongodump --db grocery_delivery_db --out ./backup
   ```

2. **Import to Atlas**:
   - Use MongoDB Compass or Atlas UI
   - Or seed new data with `npm run seed`

3. **Switch connection string** in `.env` to MongoDB Atlas

4. **Test application** to ensure all data is accessible

## Next Steps

1. ✅ Create MongoDB Atlas account
2. ✅ Create cluster and database user
3. ✅ Get connection string
4. ✅ Update `.env` with new connection string
5. ✅ Test backend connection
6. ✅ Start using MongoDB Atlas!

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Connection String URI Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [Mongoose Connection Options](https://mongoosejs.com/docs/connections.html)
- [MongoDB Atlas Security](https://docs.atlas.mongodb.com/security/)
