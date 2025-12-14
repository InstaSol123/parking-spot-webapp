# 🔧 Parking Spot Application - Troubleshooting & Setup Guide

## Current System Status

### ✅ Completed
- [x] Frontend dependencies installed (React, Vite, etc.)
- [x] Backend dependencies installed (Express, Prisma, etc.)
- [x] Backend `.env` file created with correct configuration
- [x] Frontend `.env.local` configured (http://localhost:5173)

### ⚠️ Incomplete - Blocking Issues
- [ ] PostgreSQL database not installed or running
- [ ] Database not initialized
- [ ] Backend cannot start without database connection

---

## 🚨 Main Issue: PostgreSQL Database

### Problem
The application requires PostgreSQL 12+ to function. Currently:
- PostgreSQL is not installed on the system
- Backend will fail to start because Prisma cannot connect to the database

### Solution: Install PostgreSQL

#### Option 1: Using APT (Debian/Ubuntu) - **RECOMMENDED**
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
sudo -u postgres psql -c "SELECT version();"
```

#### Option 2: Using Docker
```bash
# Install Docker if not present
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Create PostgreSQL container
docker run --name parking_spot_db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=parking_spot \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify
docker ps | grep parking_spot_db
```

---

## 📋 Complete Setup Checklist

Follow these steps in order:

### Phase 1: Install System Dependencies
```bash
# 1. Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# 2. Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Verify PostgreSQL is running
sudo systemctl status postgresql

# 4. Check version
psql --version
```

### Phase 2: Setup Application Database
```bash
# 1. Create parking_spot database (as postgres user)
sudo -u postgres createdb parking_spot

# 2. Verify database created
sudo -u postgres psql -l | grep parking_spot

# 3. Expected output:
#  parking_spot | postgres | UTF8   | C.UTF-8 | C.UTF-8 | =Tc/postgres ...
```

### Phase 3: Initialize Backend
```bash
# 1. Navigate to backend
cd /home/owner/parking\ spot/backend

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run database migrations
npm run prisma:migrate -- --name init

# 4. Expected output:
# Your database is now in sync with your schema. 
# ✓ Generated Prisma Client
```

### Phase 4: Start Services
```bash
# Terminal 1: Start Backend (Port 5000)
cd /home/owner/parking\ spot/backend
npm run dev

# Expected output:
# ✓ Server running on port 5000
# ✓ Database connected
# ✓ Default roles created
# ✓ Default subscription plans created
# ✓ Default system settings created
# ✓ Default SMS templates created
```

```bash
# Terminal 2: Start Frontend (Port 5173)
cd /home/owner/parking\ spot
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
```

### Phase 5: Test Application
1. Open browser: http://localhost:5173
2. You should see the Parking Spot login page
3. Login with test credentials:
   - Email: admin@admin.com
   - Password: admin

---

## 🐛 Common Errors & Solutions

### Error 1: "PostgreSQL service not found"
```
Error: Unit postgresql.service could not be found.
```

**Solution:**
```bash
# Install PostgreSQL first
sudo apt update
sudo apt install postgresql -y
sudo systemctl start postgresql
```

### Error 2: "psql: command not found"
```
Command 'psql' not found, but can be installed with:
  sudo apt install postgresql-client-common
```

**Solution:**
```bash
sudo apt install postgresql-client postgresql-contrib -y
```

### Error 3: "Failed to initialize database"
```
Error: getaddrinfo ENOTFOUND localhost
```

**Causes & Solutions:**
```bash
# 1. PostgreSQL not running
sudo systemctl start postgresql
sudo systemctl status postgresql

# 2. Wrong DATABASE_URL in .env
# Check backend/.env:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parking_spot"

# 3. Password issue
# Change PostgreSQL postgres user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# 4. Port 5432 in use by another service
lsof -i :5432
# Kill if needed: kill -9 <PID>
```

### Error 4: "Port 5000 already in use"
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process (replace XXXX with PID)
kill -9 XXXX

# Alternative: Change port in backend/.env
PORT=5001
```

### Error 5: "Port 5173 already in use"
```
Error: listen EADDRINUSE: address already in use :::5173
```

**Solution:**
```bash
# Find and kill process
lsof -i :5173
kill -9 <PID>

# Or change port in vite.config.ts:
# port: 5174 (if 5173 occupied)
```

### Error 6: "Cannot find module 'express'"
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Backend dependencies not installed
cd /home/owner/parking\ spot/backend
npm install

# Or reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error 7: "Frontend not connecting to backend"
```
Error: Failed to fetch http://localhost:5000/api/auth/login
```

**Causes & Solutions:**
```bash
# 1. Backend not running
npm run dev  # in backend directory

# 2. Wrong API_URL in .env.local
# Check /home/owner/parking\ spot/.env.local
VITE_API_URL=http://localhost:5000

# 3. CORS issue (backend received request but rejected)
# Check backend output for CORS errors
# Verify frontend URL matches FRONTEND_URL in backend/.env

# 4. Port 5000 not accessible
curl http://localhost:5000/health
# Should return: {"success":true,"message":"Backend is running"}
```

---

## 🔍 Diagnostic Commands

Run these to check system status:

```bash
# 1. Check PostgreSQL status
sudo systemctl status postgresql

# 2. Check if database exists
sudo -u postgres psql -l | grep parking_spot

# 3. Check if ports are available
lsof -i :5000    # Backend port
lsof -i :5173    # Frontend port
lsof -i :5432    # Database port

# 4. Test database connection
psql -h localhost -U postgres -d parking_spot -c "SELECT version();"

# 5. Check backend logs
# (while npm run dev is running, check terminal output)

# 6. Check frontend connectivity to backend
curl http://localhost:5000/health

# 7. Check npm dependencies
cd /home/owner/parking\ spot/backend && npm list
cd /home/owner/parking\ spot && npm list
```

---

## 📝 Configuration Files

### Backend Configuration: `/backend/.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parking_spot"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

### Frontend Configuration: `.env.local`
```env
VITE_API_URL=http://localhost:5000
```

---

## 🎯 Step-by-Step Recovery Instructions

If your application is not working, follow this exact sequence:

### Step 1: Verify PostgreSQL
```bash
# Check if PostgreSQL is installed
which psql

# If not found, install:
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql

# Verify running
sudo systemctl status postgresql
# Should show: active (running)
```

### Step 2: Create Database
```bash
# Create database
sudo -u postgres createdb parking_spot

# Verify created
sudo -u postgres psql -l | grep parking_spot
# Should show parking_spot in the list
```

### Step 3: Initialize Backend Database
```bash
# Navigate to backend
cd /home/owner/parking\ spot/backend

# Check .env exists
cat .env
# Should show DATABASE_URL, JWT_SECRET, etc.

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate -- --name init
# Should complete successfully
```

### Step 4: Test Backend Connection
```bash
# Still in backend directory
npm run dev

# Wait for output:
# ✓ Server running on port 5000
# ✓ Database connected

# In another terminal, test:
curl http://localhost:5000/health
# Should return: {"success":true,"message":"Backend is running"}
```

### Step 5: Start Frontend
```bash
# In new terminal
cd /home/owner/parking\ spot
npm run dev

# Should show:
# ➜  Local:   http://localhost:5173/
```

### Step 6: Test Application
```bash
# Open browser: http://localhost:5173
# Login with:
# Email: admin@admin.com
# Password: admin
# Should see dashboard
```

---

## 🆘 If Problems Persist

### Get Detailed Error Info
```bash
# 1. Check backend logs
# (Keep terminal open showing "npm run dev" output)

# 2. Check frontend browser console (F12)
# Press F12 → Console tab → Look for errors

# 3. Check database logs
sudo tail -50 /var/log/postgresql/postgresql*.log

# 4. Check if database tables created
sudo -u postgres psql parking_spot -c "\dt"
# Should show tables like User, QRCodeData, etc.
```

### Reset Everything (Last Resort)
```bash
# 1. Stop services (Ctrl+C in both terminals)

# 2. Drop and recreate database
sudo -u postgres dropdb parking_spot
sudo -u postgres createdb parking_spot

# 3. Regenerate Prisma
cd /home/owner/parking\ spot/backend
npm run prisma:generate

# 4. Re-migrate
npm run prisma:migrate -- --name init

# 5. Restart servers
npm run dev  # Backend first
# Then in new terminal:
npm run dev  # Frontend
```

---

## ✅ Success Indicators

You'll know everything is working when you see:

**Backend Terminal:**
```
✓ Server running on port 5000
✓ Database connected
✓ Default roles created
✓ Default subscription plans created
✓ Default system settings created
✓ Default SMS templates created
```

**Frontend Terminal:**
```
➜  Local:   http://localhost:5173/
```

**Browser:**
- Page loads at http://localhost:5173
- Shows Parking Spot login form
- Can login with admin@admin.com / admin
- Dashboard appears after login

---

## 📞 Need Help?

1. **Read** the full troubleshooting section above
2. **Check** diagnostic commands output
3. **Verify** all configuration files are correct
4. **Review** BACKEND_SETUP.md for more details
5. **Check** ARCHITECTURE.md for system design

---

**Last Updated:** December 12, 2025
**Status:** PostgreSQL Setup Required to Proceed
