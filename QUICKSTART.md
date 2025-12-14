# 🚀 Quick Start - Parking Spot Backend Setup

Get the fully functional backend-powered application running in under 10 minutes.

## Prerequisites

- Node.js 16+ ([Download](https://nodejs.org))
- PostgreSQL 12+ ([Download](https://www.postgresql.org/download) or use Docker)
- Git (for cloning, if applicable)

## Option 1: Automated Setup (Recommended)

### For macOS/Linux:

```bash
cd /home/owner/parking\ spot

# Make setup script executable
chmod +x setup.sh

# Run the setup
./setup.sh
```

The script will:
- Create PostgreSQL database
- Install all dependencies (backend & frontend)
- Configure environment variables
- Run database migrations
- Display next steps

---

## Option 2: Manual Setup (Step by Step)

### Step 1: Create Database

Using PostgreSQL command line:
```bash
createdb parking_spot
```

Or using a database GUI, create a new database named `parking_spot`.

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd /home/owner/parking\ spot/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env - update DATABASE_URL if needed
# Default: postgresql://postgres:postgres@localhost:5432/parking_spot

# Setup database
npm run prisma:generate
npm run prisma:migrate -- --name init

# Start backend server (this runs on port 5000)
npm run dev
```

You should see:
```
✓ Server running on port 5000
✓ Database connected
✓ Default roles created
✓ Default subscription plans created
```

### Step 3: Frontend Setup

Open a **NEW terminal window** in the same directory:

```bash
# From /home/owner/parking spot
cd .

# Install dependencies
npm install

# Start frontend development server (this runs on port 5173)
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
```

---

## Accessing the Application

Open your browser and go to: **http://localhost:5173**

### Login with Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@admin.com | admin |
| Distributor | dist@dist.com | admin |
| Retailer | retailer@ret.com | admin |

---

## Using Docker for PostgreSQL (Optional)

If you don't have PostgreSQL installed:

```bash
# Make sure Docker is running, then:
docker-compose up -d postgres

# The database will be available on localhost:5432
# Username: postgres
# Password: postgres
# Database: parking_spot
```

---

## Terminal Layout (Recommended)

For optimal development experience, arrange terminals like this:

```
Terminal 1: Backend
$ cd backend && npm run dev
[Watching for changes...]

Terminal 2: Frontend  
$ npm run dev
[Watching for changes...]

Terminal 3: Just keep it available for git/npm commands
```

---

## API Testing

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"success":true,"message":"Backend is running"}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin"}'
```

---

## Common Issues & Solutions

### Port 5000 Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill it (replace 12345 with actual PID)
kill -9 12345
```

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL is running: `brew services start postgresql` (macOS)
- Check DATABASE_URL in `backend/.env`
- Try: `psql -U postgres` (should open PostgreSQL prompt)

### Port 5173 Already in Use
```bash
lsof -i :5173
kill -9 <PID>
```

### Module Not Found Errors
```bash
# Ensure you're in the right directory and reinstall
npm install --legacy-peer-deps
```

### Database Migration Failed
```bash
# Reset and retry
npm run prisma:migrate -- --name init
npm run prisma:generate
npm run dev
```

---

## Features to Explore

After logging in, try these features:

### As Admin:
1. **Generate QRs** - Dashboard → QR Management → Generate QRs
2. **Manage Plans** - Settings → Subscription Plans
3. **Broadcast Notifications** - Admin → Notification Center
4. **Create Custom Roles** - Role Management → Create Role
5. **View All Distributors** - Users section

### As Distributor:
1. **Create Retailers** - Users → Create User
2. **Request Credits** - Dashboard → Request Credits
3. **View Pending Approvals** - Dashboard → Pending Requests
4. **Track Sales** - Financials section

### As Retailer:
1. **Activate QR Codes** - QR Management → Select unused QR
2. **Manage Customers** - View activated QRs and owner details
3. **Request Credits** - Dashboard → Request Credits
4. **Track Transactions** - Dashboard → My Requests

---

## File Structure

```
parking spot/
├── backend/                    # ← Backend API Server
│   ├── src/routes/            # 7 API route files
│   ├── prisma/schema.prisma    # Database schema
│   ├── package.json            # Backend dependencies
│   └── .env                    # Backend config
├── src/
│   ├── services/api.ts         # ← API client (calls backend)
│   ├── components/             # React components
│   └── App.tsx
├── package.json                # Frontend dependencies
├── vite.config.ts              # Frontend config (port 5173)
├── .env.local                  # Frontend config
├── BACKEND_SETUP.md            # Detailed setup guide
├── ARCHITECTURE.md             # Technical architecture
├── CONVERSION_SUMMARY.md       # What was delivered
└── setup.sh                    # Automated setup script
```

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/parking_spot
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env.local`)
```
VITE_API_URL=http://localhost:5000
```

---

## Production Deployment

When ready to deploy:

### Build Frontend
```bash
npm run build
# Creates optimized dist/ folder
```

### Build Backend
```bash
cd backend
npm run build
npm run start
```

---

## Next Steps

1. ✅ Run setup.sh or manual setup (above)
2. ✅ Start backend (npm run dev in backend/)
3. ✅ Start frontend (npm run dev in root)
4. ✅ Open http://localhost:5173
5. ✅ Login with test credentials
6. ✅ Explore features
7. ✅ Read ARCHITECTURE.md for technical details
8. ✅ Read BACKEND_SETUP.md for complete API reference

---

## Getting Help

### Check Logs
- **Backend logs**: Look in terminal where `npm run dev` is running
- **Frontend logs**: Browser DevTools Console (F12)
- **Database logs**: Check PostgreSQL logs

### Read Documentation
- `BACKEND_SETUP.md` - Operations guide and API endpoints
- `ARCHITECTURE.md` - Technical deep dive
- Code comments - Inline documentation in source files

### Common Endpoints
```
POST   /api/auth/login              - Login
POST   /api/auth/register           - Register
GET    /api/qrs                     - List QR codes
POST   /api/qrs/generate            - Generate QRs (admin)
POST   /api/qrs/:id/activate        - Activate QR (retailer)
GET    /api/users                   - List users
POST   /api/transactions/request    - Request credits
POST   /api/transactions/:id/approve - Approve credits (admin/dist)
GET    /api/notifications           - Get notifications
POST   /api/notifications           - Send notification (admin)
```

---

## System Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Frontend      │         │   Backend API    │
│  (Port 5173)    │────────→│   (Port 5000)    │
│   React + Vite  │←────────│  Express.js      │
└─────────────────┘         └──────────────────┘
        ↓                           ↓
    localStorage              PostgreSQL DB
    (auth token)              (port 5432)
```

---

## Performance Tips

- Keep browser DevTools closed for better performance
- Use Chrome/Firefox (not Safari for development)
- Clear browser cache if facing issues: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Win)
- Enable source maps in DevTools for debugging

---

## Success Indicators

✅ Backend running on port 5000
✅ Frontend accessible at http://localhost:5173
✅ Can login with test credentials
✅ Can see dashboard with user data
✅ Can generate QR codes (as admin)
✅ Can activate QR codes (as retailer)
✅ Can request/approve credits
✅ Can send notifications (as admin)

---

## Support

For detailed information:
- Backend Setup & APIs: See `BACKEND_SETUP.md`
- Architecture & Design: See `ARCHITECTURE.md`
- What Was Delivered: See `CONVERSION_SUMMARY.md`

---

**Ready to start?** Run `./setup.sh` or follow Option 2 above! 🎉
