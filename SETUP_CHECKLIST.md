# HealthSphere Setup Checklist

Use this checklist to get HealthSphere running for demos.

## ☑️ Prerequisites

- [ ] Node.js installed (v18 or higher)
- [ ] MongoDB installed locally OR MongoDB Atlas account
- [ ] Google Gemini API key (optional for AI features)
- [ ] Terminal/command line access

## 📦 Installation Steps

### 1. Install Dependencies
```bash
cd Health
npm install
```
**Expected**: Should install ~50 packages without errors

### 2. Install Dev Dependencies
```bash
npm install --save-dev tsx dotenv
```
**Expected**: Adds tsx and dotenv to package.json

### 3. Setup Environment Variables
```bash
cp .env.example .env.local
```

**Edit `.env.local`**:
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/healthsphere

# Optional (for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
```

**For MongoDB Atlas** (if not using local):
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthsphere
```

### 4. Verify MongoDB Connection

**If using local MongoDB**:
```bash
# Check if MongoDB is running
mongosh
# Should connect without error
# Type: exit
```

**If using MongoDB Atlas**:
- Login to MongoDB Atlas
- Create cluster if needed
- Get connection string
- Replace in .env.local

### 5. Seed Database
```bash
npm run seed
```

**Expected Output**:
```
🌱 Starting database seeding...
📡 Connecting to: mongodb://localhost:27017/***
✅ Connected to MongoDB
🗑️  Clearing existing data...
✅ Cleared existing collections
👥 Creating demo users...
✅ Created 5 users
📋 Creating medical records...
✅ Created 3 medical records
💊 Creating prescriptions...
✅ Created 3 prescriptions
📅 Creating appointments...
✅ Created 4 appointments
🔍 Creating indexes...
✅ Created indexes
✨ Database seeding completed successfully!
```

**If seed fails**:
- Check MongoDB is running: `mongosh`
- Check connection string in .env.local
- Check network connection (for Atlas)

### 6. Start Development Server
```bash
npm run dev
```

**Expected Output**:
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### 7. Open in Browser
```bash
# Open browser to:
http://localhost:3000
```

**Expected**: Should see HealthFlow homepage with role selection

## ✅ Verification Tests

### Test 1: Patient Login
- [ ] Click "Patient" on homepage
- [ ] Email: `john@example.com`
- [ ] Password: `password123`
- [ ] Should see patient dashboard
- [ ] Click "Medical Records" - should see 2 records
- [ ] Click "Prescriptions" - should see 2 prescriptions
- [ ] Click "Appointments" - should see appointments

### Test 2: Doctor Login
- [ ] Logout (or open incognito window)
- [ ] Click "Doctor" on homepage
- [ ] Email: `dr.smith@example.com`
- [ ] Password: `password123`
- [ ] Should see doctor dashboard
- [ ] Click "Patients" - should see patient list
- [ ] Click on John Doe - should see patient details
- [ ] Try "Create Medical Record" button

### Test 3: Admin Login
- [ ] Logout
- [ ] Click "Admin" on homepage
- [ ] Email: `admin@example.com`
- [ ] Password: `password123`
- [ ] Should see admin dashboard
- [ ] Click "Users" - should see 5 users
- [ ] Filter by role - should work

### Test 4: AI Features (Optional)
Requires `GEMINI_API_KEY` in .env.local

- [ ] Login as doctor
- [ ] Go to patient details
- [ ] Create medical record with diagnosis
- [ ] Click "Generate AI Prescription"
- [ ] Should see AI suggestions appear

## 🐛 Troubleshooting

### Problem: "Cannot connect to MongoDB"
**Solution**:
```bash
# Check if MongoDB is running
mongosh

# If not running, start MongoDB:
# macOS: brew services start mongodb-community
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
```

### Problem: "MONGODB_URI is not defined"
**Solution**:
- Check `.env.local` exists (not `.env.example`)
- Check file is in `Health/` folder (not subfolder)
- Restart dev server after creating .env.local

### Problem: "Cannot find module 'tsx'"
**Solution**:
```bash
npm install --save-dev tsx dotenv
```

### Problem: "Seed script fails with authentication error"
**Solution**:
- If using MongoDB Atlas, check username/password in connection string
- Check IP whitelist in MongoDB Atlas
- Try: `mongodb://localhost:27017/healthsphere` for local

### Problem: "Port 3000 is already in use"
**Solution**:
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill
```

### Problem: "Cannot GET /api/..."
**Solution**:
- Make sure you're logged in first
- Check browser console for errors
- Check Network tab for 401 errors (means not authenticated)

### Problem: Demo credentials don't work
**Solution**:
```bash
# Re-run seed script
npm run seed

# Should see: "✅ Created 5 users"
```

## 📊 Verify Database Contents

### Using MongoDB Compass (GUI)
1. Download MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Open database: `healthsphere`
4. Should see collections:
   - `users` (5 documents)
   - `medical_records` (3 documents)
   - `prescriptions` (3 documents)
   - `appointments` (4 documents)
   - `sessions` (created on login)

### Using mongosh (CLI)
```bash
mongosh
use healthsphere
db.users.countDocuments()        # Should return: 5
db.medical_records.countDocuments()  # Should return: 3
db.prescriptions.countDocuments()    # Should return: 3
db.appointments.countDocuments()     # Should return: 4
```

## 🎯 Ready for Demo?

Final checklist:
- [ ] Can login as patient (john@example.com / password123)
- [ ] Can login as doctor (dr.smith@example.com / password123)
- [ ] Can login as admin (admin@example.com / password123)
- [ ] Medical records appear for patients
- [ ] Doctor can see patient list
- [ ] Admin can see all users
- [ ] No console errors in browser
- [ ] MongoDB connection working

## 🚀 If Everything Works

You're ready! Here's what you have:

✅ **Working Features**:
- Role-based authentication (Patient, Doctor, Admin)
- Medical records CRUD operations
- Prescription management
- Appointment scheduling
- User management
- Analytics dashboard
- AI clinical decision support (with Gemini API key)

⚠️ **Known Limitations**:
- Plain text passwords (demo only)
- No rate limiting
- No automated tests
- Not HIPAA compliant

📚 **Documentation**:
- `README.md` - Project overview
- `HEALTHSPHERE_IMPLEMENTATION_STATUS.md` - Full implementation report
- `SECURITY_TODO.md` - Security improvements needed
- `SETUP_CHECKLIST.md` - This file

## 📞 Quick Commands Reference

```bash
# Install everything
npm install
npm install --save-dev tsx dotenv

# Setup
cp .env.example .env.local
# Edit .env.local with your MongoDB URI

# Seed database
npm run seed

# Run dev server
npm run dev

# Run in production mode
npm run build
npm start
```

## 🎓 For Interviews

When demoing, mention:
- "Full-stack Next.js application with MongoDB backend"
- "Role-based access control with three user types"
- "Real database operations, not localStorage"
- "AI integration with Google Gemini for clinical decision support"
- "Documented security improvements needed for production"

**Good luck! 🚀**

---

Last Updated: September 22, 2026
