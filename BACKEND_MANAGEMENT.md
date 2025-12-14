# Backend Service Management Guide

## Current Service Status

**Status:** ✅ RUNNING  
**PID:** 231755  
**Port:** 5000  
**Node Version:** v24.11.1

---

## Quick Commands

### Check Service Status
```bash
# Check if running on port 5000
lsof -i :5000

# Check process
ps aux | grep "npm start" | grep -v grep

# Health check
curl http://localhost:5000/health
```

### Start/Stop/Restart Backend

#### Start Backend
```bash
cd "/home/owner/parking spot/backend"
npm start
```

#### Stop Backend
```bash
# Method 1: Kill by PID
kill 231755

# Method 2: Kill by port
kill $(lsof -t -i:5000)

# Method 3: Using pkill
pkill -f "node dist/src/index.js"
```

#### Restart Backend
```bash
# Kill existing process
kill $(lsof -t -i:5000) 2>/dev/null

# Wait a moment
sleep 2

# Start backend
cd "/home/owner/parking spot/backend"
npm start
```

#### Running in Background
```bash
# Start in background
cd "/home/owner/parking spot/backend"
nohup npm start > /var/log/parking-spot-backend.log 2>&1 &

# Or with &
npm start &
```

---

## Test Critical Endpoints

### Test Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Backend is running"
}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "...", "email": "admin@admin.com", "role": "SUPER_ADMIN" }
  }
}
```

### Test Protected Endpoint
```bash
# First, get token from login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin"}' | jq -r '.data.token')

# Then use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/users
```

---

## Configuration

### Environment Variables
```
FILE: /home/owner/parking spot/backend/.env.production

PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/parking_spot
JWT_SECRET=3a7b9c2f5e8d1a4b6c3f9e8d2a7b4c1f5e8d3a7b9c2f5e8d1a4b6c3f9e8d2a7b
FRONTEND_URL=https://qr.mytesting.cloud
```

### Update Configuration
```bash
# Edit environment file
nano "/home/owner/parking spot/backend/.env.production"

# Restart backend after changes
kill $(lsof -t -i:5000)
sleep 2
cd "/home/owner/parking spot/backend"
npm start
```

---

## Logging

### View Recent Logs
```bash
# If running in foreground, logs appear in terminal
# If running in background with nohup:
tail -f /var/log/parking-spot-backend.log

# View last 50 lines
tail -n 50 /var/log/parking-spot-backend.log

# View logs with timestamps
tail -f /var/log/parking-spot-backend.log | grep -E "\[|ERROR|success"
```

### Clear Logs
```bash
> /var/log/parking-spot-backend.log
```

---

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill it
kill -9 <PID>

# Verify port is free
lsof -i :5000  # Should return nothing
```

### Database Connection Error
```bash
# Verify database is running
psql -U postgres -h localhost -c "SELECT 1;"

# Check connection string
cat "/home/owner/parking spot/backend/.env.production" | grep DATABASE_URL

# Verify credentials
# DATABASE_URL="postgresql://postgres:postgres@postgres:5432/parking_spot"
```

### Backend Crashes on Start
```bash
# Check if node_modules installed
cd "/home/owner/parking spot/backend"
npm install

# Rebuild TypeScript
npm run build

# Try start again
npm start
```

### JWT Token Errors
```bash
# Verify JWT_SECRET is set
cat "/home/owner/parking spot/backend/.env.production" | grep JWT_SECRET

# Should not be empty
echo $JWT_SECRET  # From terminal
```

---

## Performance Monitoring

### Check Resource Usage
```bash
# Monitor Node.js process
ps aux | grep "node"

# Memory and CPU
top -p $(pgrep -f "node dist")

# Real-time monitoring
watch -n 1 "ps aux | grep 'node dist'"
```

### Monitor Port Activity
```bash
# Real-time network monitoring
lsof -i :5000
netstat -tuln | grep 5000
ss -tuln | grep 5000
```

---

## Advanced: PM2 Process Manager

### Install PM2
```bash
npm install -g pm2
```

### Start with PM2
```bash
cd "/home/owner/parking spot/backend"
pm2 start "npm start" --name "parking-spot-backend"
```

### PM2 Commands
```bash
# List running processes
pm2 list

# View logs
pm2 logs parking-spot-backend

# Monitor
pm2 monit

# Restart
pm2 restart parking-spot-backend

# Stop
pm2 stop parking-spot-backend

# Delete from PM2
pm2 delete parking-spot-backend

# Enable auto-startup
pm2 startup
pm2 save

# Disable auto-startup
pm2 unstartup
```

---

## Advanced: Systemd Service

### Create Service File
```bash
sudo nano /etc/systemd/system/parking-spot-backend.service
```

Add content:
```ini
[Unit]
Description=Parking Spot Backend API Server
After=network.target postgresql.service

[Service]
Type=simple
User=owner
WorkingDirectory=/home/owner/parking spot/backend
Environment="NODE_ENV=production"
EnvironmentFile=/home/owner/parking spot/backend/.env.production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Enable Systemd Service
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start
sudo systemctl enable parking-spot-backend

# Start service
sudo systemctl start parking-spot-backend

# Check status
sudo systemctl status parking-spot-backend

# View logs
sudo journalctl -u parking-spot-backend -f

# Restart
sudo systemctl restart parking-spot-backend

# Stop
sudo systemctl stop parking-spot-backend
```

---

## Dependencies Management

### Check Installed Packages
```bash
cd "/home/owner/parking spot/backend"
npm list
npm list --depth=0
```

### Update Packages
```bash
npm update

# Update specific package
npm update express

# Check outdated
npm outdated
```

### Reinstall Dependencies
```bash
cd "/home/owner/parking spot/backend"
rm -rf node_modules package-lock.json
npm install
```

---

## Database Management

### Connect to Database
```bash
# Via psql
psql -U postgres -h localhost -d parking_spot

# Check tables
\dt

# Check users
SELECT * FROM "User";

# Exit
\q
```

### Prisma Commands
```bash
cd "/home/owner/parking spot/backend"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Studio (GUI)
npm run prisma:studio
```

---

## Summary

**Current Status:** ✅ Backend running on port 5000  
**Process ID:** 231755  
**All endpoints:** ✅ Responding  
**Database:** ✅ Connected  

Use these commands to manage the backend service. For production use, consider PM2 or Systemd for automatic restart capabilities.
