# Verification & Maintenance Scripts

This document describes the utility scripts available in the Parking Spot application.

---

## Overview

Three utility scripts are available for database management and verification:

1. **`verify-all-fixes.ts`** - Verify all three issues are fixed
2. **`backend/cleanup-all-data.ts`** - Reset database to fresh state
3. **`backend/reset-credits.ts`** - Reset credit balances

All scripts use Prisma ORM to interact with the PostgreSQL database directly.

---

## Script Locations

```
parking spot/
├── backend/
│   ├── verify-all-fixes.ts      ← Verification script
│   ├── cleanup-all-data.ts      ← Data cleanup script
│   └── reset-credits.ts         ← Credit reset script
└── ...
```

---

## Running the Scripts

### Prerequisites

Before running any script, ensure:

1. ✅ Backend dependencies installed: `npm install` (in backend/)
2. ✅ TypeScript compiled: `npm run build` (in backend/)
3. ✅ Database running: PostgreSQL accessible
4. ✅ Backend running or database configured in .env.production

### From Backend Directory

```bash
cd "/home/owner/parking spot/backend"

# Run verification script
npx ts-node verify-all-fixes.ts

# Run cleanup script  
npx ts-node cleanup-all-data.ts

# Run reset credits script
npx ts-node reset-credits.ts
```

### Alternative: Using Node

If TypeScript is compiled:

```bash
cd "/home/owner/parking spot/backend"

# Compile if needed
npm run build

# Run with Node
node dist/verify-all-fixes.js
node dist/cleanup-all-data.js
node dist/reset-credits.js
```

---

## Script Descriptions

### 1. Verify All Fixes (`verify-all-fixes.ts`)

**Purpose:** Verify that all three issues have been fixed.

**What it does:**
- ✅ Tests credit history endpoint
- ✅ Verifies document fields in API responses
- ✅ Confirms plans display correctly
- ✅ Generates comprehensive report

**Usage:**
```bash
npx ts-node backend/verify-all-fixes.ts
```

**Expected Output:**
```
✓ Test 1: Credit history endpoint accessible - PASS
✓ Test 2: Document fields available in API response - PASS
✓ Test 3: Plans endpoint accessible and returns data - PASS

Results: 3 PASSED, 0 FAILED
🎉 ALL ISSUES FIXED AND VERIFIED! 🎉
```

**Requirements:**
- Backend running on port 5000
- Test accounts created (admin@admin.com, dist@dist.com, retailer@ret.com)

---

### 2. Cleanup All Data (`cleanup-all-data.ts`)

**Purpose:** Reset database to fresh state while preserving core test accounts.

**What it does:**
- ✅ Deletes all QR codes
- ✅ Deletes all transactions
- ✅ Deletes all notifications
- ✅ Deletes all credit logs
- ✅ Deletes all plans
- ✅ Deletes all non-core users
- ✅ Resets credit balances:
  - Admin: 2,000,000 credits
  - Distributor: 0 credits
  - Retailer: 0 credits

**Usage:**
```bash
npx ts-node backend/cleanup-all-data.ts
```

**Expected Output:**
```
✓ Deleted X QR code records
✓ Deleted X transaction records
✓ Deleted X notification records
✓ Deleted X credit log records
✓ Deleted X plan records
✓ Deleted X non-core user accounts

Final Status:
  Total Users: 3 (core accounts only)
  QR Codes: 0
  Transactions: 0
  Notifications: 0
  Credit Logs: 0
  Plans: 0

✅ Comprehensive cleanup completed successfully!
```

**Use Cases:**
- Fresh start for testing
- Clean up test data before demo
- Reset to initial state

---

### 3. Reset Credits (`reset-credits.ts`)

**Purpose:** Reset credit balances for all users.

**What it does:**
- ✅ Sets Super Admin credits to 2,000,000
- ✅ Sets all Distributors to 0 credits
- ✅ Sets all Retailers to 0 credits
- ✅ Creates credit records if they don't exist

**Usage:**
```bash
npx ts-node backend/reset-credits.ts
```

**Expected Output:**
```
✓ Super Admin credits set to 2,000,000
✓ Reset 1 distributor account(s) to 0 credits
✓ Reset 1 retailer account(s) to 0 credits

Credits Reset Summary:
  Super Admin: 2,000,000 credits
  Distributors: 0 credits (1 accounts)
  Retailers: 0 credits (1 accounts)

✅ Credits reset completed successfully!
```

**Use Cases:**
- Reset credits without deleting data
- Start fresh credit cycle
- Undo credit transactions

---

## Database Models Affected

### Cleanup Script Deletes:

| Table | Operation |
|-------|-----------|
| QRCodeData | DELETE all records |
| Transaction | DELETE all records |
| Notification | DELETE all records |
| CreditLog | DELETE all records |
| Plan | DELETE all records |
| User | DELETE non-core users |
| Credits | UPDATE (reset balances) |

### Reset Script Updates:

| Table | Operation |
|-------|-----------|
| Credits | UPDATE balances |
| User | No changes |

### Core Users (Preserved):

| Email | Role | Preserved By |
|-------|------|--------------|
| admin@admin.com | SUPER_ADMIN | Both scripts |
| dist@dist.com | DISTRIBUTOR | Both scripts |
| retailer@ret.com | RETAILER | Both scripts |

---

## Troubleshooting

### Error: "Cannot find module 'axios'"

**Cause:** Running from wrong directory

**Fix:**
```bash
# Run from backend directory
cd "/home/owner/parking spot/backend"
npx ts-node verify-all-fixes.ts
```

### Error: "Cannot find module './src/lib/prisma.js'"

**Cause:** Prisma not compiled or database not configured

**Fix:**
```bash
cd "/home/owner/parking spot/backend"
npm install
npm run prisma:generate
npm run build
```

### Error: "connect ECONNREFUSED"

**Cause:** Database not running or .env.production not configured

**Fix:**
```bash
# Verify database is running
psql -U postgres -h localhost -d parking_spot -c "SELECT 1"

# Verify .env.production
cat "/home/owner/parking spot/backend/.env.production"
```

### Error: "no such table"

**Cause:** Database migrations not run

**Fix:**
```bash
cd "/home/owner/parking spot/backend"
npm run prisma:migrate
```

---

## Script Execution Flow

### Verify All Fixes

```
START
  ↓
[Connect to DB via Prisma]
  ↓
[Login as distributor via API]
  ↓
[Test ISSUE 1: Credit History]
  ├─ Query /api/users/{id}/credit-history
  ├─ Check response contains credit logs
  └─ Report: PASS/FAIL
  ↓
[Test ISSUE 2: Document Fields]
  ├─ Query /api/users/{id}
  ├─ Check for aadhaar, pan, gst, msme, address fields
  └─ Report: PASS/FAIL
  ↓
[Test ISSUE 3: Plans]
  ├─ Query /api/users/{id} for plans field
  ├─ Query /api/plans/distributor/{id}
  └─ Report: PASS/FAIL
  ↓
[Generate Summary Report]
  ↓
END
```

### Cleanup All Data

```
START
  ↓
[Connect to DB via Prisma]
  ↓
[Identify Core Users]
  ├─ admin@admin.com
  ├─ dist@dist.com
  └─ retailer@ret.com
  ↓
[Delete All Data]
  ├─ QR Codes → 0
  ├─ Transactions → 0
  ├─ Notifications → 0
  ├─ Credit Logs → 0
  ├─ Plans → 0
  └─ Non-Core Users → 0
  ↓
[Reset Credits]
  ├─ Admin: 2,000,000
  ├─ Distributors: 0
  └─ Retailers: 0
  ↓
[Report Final Status]
  ↓
END
```

### Reset Credits

```
START
  ↓
[Connect to DB via Prisma]
  ↓
[Find Super Admin]
  ├─ Query admin@admin.com
  └─ Set to 2,000,000 credits
  ↓
[Reset All Distributors]
  └─ Set to 0 credits
  ↓
[Reset All Retailers]
  └─ Set to 0 credits
  ↓
[Report Summary]
  ↓
END
```

---

## Environment Requirements

### Required Environment Variables

Set in `/home/owner/parking spot/backend/.env.production`:

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/parking_spot
NODE_ENV=production
```

### Node Environment

```
Node.js: v24.11.1
npm: 10+
TypeScript: 5.3.3
Prisma: 5.22.0
```

---

## Best Practices

### Before Running Cleanup:

1. ✅ Backup database (if production)
2. ✅ Verify you want to delete all data
3. ✅ Stop any running tests
4. ✅ Confirm backend service will restart cleanly

### After Running Scripts:

1. ✅ Verify final state with verification script
2. ✅ Restart backend service
3. ✅ Run quick API tests
4. ✅ Check browser console for errors

### Automation:

To run cleanup on schedule, create a cron job:

```bash
# Edit crontab
crontab -e

# Add (daily at 2 AM):
0 2 * * * cd /home/owner/parking\ spot/backend && npx ts-node cleanup-all-data.ts >> /var/log/cleanup.log 2>&1
```

---

## Summary

| Script | Location | Purpose | Time |
|--------|----------|---------|------|
| verify-all-fixes.ts | backend/ | Verify fixes | ~10 sec |
| cleanup-all-data.ts | backend/ | Fresh start | ~5 sec |
| reset-credits.ts | backend/ | Reset balances | ~3 sec |

All scripts are safe and reversible (except deletion of non-core users).

---

**Last Updated:** December 14, 2025  
**Status:** ✅ Ready to use
