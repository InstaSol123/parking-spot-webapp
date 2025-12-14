# Plans System Architecture Diagram

## Hierarchical Plan Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM HIERARCHY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LEVEL 1: SUPER_ADMIN                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Role: SUPER_ADMIN                                                   │  │
│  │ Email: admin@admin.com                                              │  │
│  │ Parent: None (NULL)                                                 │  │
│  │                                                                     │  │
│  │ CREATES PLANS FOR:                                                 │  │
│  │ ├─ Plan 1: Premium - 500 Credits - ₹5000                           │  │
│  │ ├─ Plan 2: Starter - 100 Credits - ₹1000                           │  │
│  │ └─ Plan 3: Enterprise - 1000 Credits - ₹10000                      │  │
│  │                                                                     │  │
│  │ VISIBILITY:                                                         │  │
│  │ └─ Shown in: Profile → Sales Settings → Manage Plans for Dist.    │  │
│  └──────────────────────────────────────────┬──────────────────────────┘  │
│                                              │                             │
│                                              │ CHILD SEES                  │
│                                              │ ADMIN PLANS IN              │
│                                              ↓ PURCHASE CREDITS            │
│                                                                             │
│  LEVEL 2: DISTRIBUTOR                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Role: DISTRIBUTOR                                                   │  │
│  │ Email: dist@dist.com                                                │  │
│  │ Parent: SUPER_ADMIN (admin@admin.com)                               │  │
│  │                                                                     │  │
│  │ RECEIVES PARENT PLANS (from Admin):                                │  │
│  │ ├─ Plan 1: Premium - 500 Credits - ₹5000                    ✅    │  │
│  │ ├─ Plan 2: Starter - 100 Credits - ₹1000                   ✅    │  │
│  │ └─ Plan 3: Enterprise - 1000 Credits - ₹10000               ✅    │  │
│  │                                                                     │  │
│  │ LOCATION: Profile → Purchase Credits → Available Plans (RIGHT)    │  │
│  │                                                                     │  │
│  │ CREATES PLANS FOR:                                                 │  │
│  │ ├─ Plan A: Gold - 100 Credits - ₹1000                             │  │
│  │ ├─ Plan B: Silver - 50 Credits - ₹500                             │  │
│  │ └─ Plan C: Bronze - 25 Credits - ₹250                             │  │
│  │                                                                     │  │
│  │ VISIBILITY (for own plans):                                         │  │
│  │ └─ Shown in: Profile → Sales Settings → Manage Plans for Ret.    │  │
│  └──────────────────────────────────────────┬──────────────────────────┘  │
│                                              │                             │
│                                              │ CHILD SEES                  │
│                                              │ DIST. PLANS IN              │
│                                              ↓ PURCHASE CREDITS            │
│                                                                             │
│  LEVEL 3: RETAILER                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Role: RETAILER                                                      │  │
│  │ Email: retailer@ret.com                                             │  │
│  │ Parent: DISTRIBUTOR (dist@dist.com)                                 │  │
│  │                                                                     │  │
│  │ RECEIVES PARENT PLANS (from Distributor):                          │  │
│  │ ├─ Plan A: Gold - 100 Credits - ₹1000                       ✅    │  │
│  │ ├─ Plan B: Silver - 50 Credits - ₹500                       ✅    │  │
│  │ └─ Plan C: Bronze - 25 Credits - ₹250                       ✅    │  │
│  │                                                                     │  │
│  │ LOCATION: Profile → Purchase Credits → Available Plans (RIGHT)    │  │
│  │                                                                     │  │
│  │ CREATES PLANS: NO (Retailers cannot create plans)                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Plan Display Locations

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    WHERE PLANS ARE DISPLAYED                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SUPER_ADMIN PANEL                                                        │
│     ├─ Location: Profile → Sales Settings                                   │
│     │  ├─ Section: "Manage Plans for Distributors"                           │
│     │  ├─ Contains: Plans they create                                        │
│     │  ├─ Editable: YES (can create/delete)                                  │
│     │  └─ Visible to: Self only (in this section)                            │
│     │                                                                        │
│     └─ Location: N/A (Admin doesn't purchase, no parent)                     │
│                                                                              │
│                                                                              │
│  2. DISTRIBUTOR PANEL                                                        │
│     ├─ Location: Profile → Sales Settings                                   │
│     │  ├─ Section: "Manage Plans for Retailers"                              │
│     │  ├─ Contains: Plans they create                                        │
│     │  ├─ Editable: YES (can create/delete)                                  │
│     │  └─ Visible to: Self only (in this section)                            │
│     │                                                                        │
│     └─ Location: Profile → Purchase Credits (RIGHT COLUMN)  ← FIX LOCATION  │
│        ├─ Section: "Available Plans" (Under Admin HQ Info)                   │
│        ├─ Contains: Admin's plans (FROM PARENT)                              │
│        ├─ Editable: NO (read-only)                                           │
│        └─ Action: Click plan to set credit amount in request                 │
│                                                                              │
│                                                                              │
│  3. RETAILER PANEL                                                           │
│     ├─ Location: Profile → Sales Settings                                   │
│     │  └─ DISABLED (Retailers cannot create plans)                           │
│     │                                                                        │
│     └─ Location: Profile → Purchase Credits (RIGHT COLUMN)                  │
│        ├─ Section: "Available Plans" (Under Distributor Info)                │
│        ├─ Contains: Distributor's plans (FROM PARENT)                        │
│        ├─ Editable: NO (read-only)                                           │
│        └─ Action: Click plan to set credit amount in request                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram - Super Admin Plans for Distributor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN CREATES PLAN                               │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ↓
                    Admin: Profile Tab
                        ↓
                Sales Settings Section
                        ↓
         "Manage Plans for Distributors"
                        ↓
         Fill: Name, Credits, Price
                        ↓
                  Click "Add" Button
                             │
                             ↓
        POST /api/plans { name, credits, price }
                             │
                             ↓
          Backend: Create Plan with
          distributorId = admin.id
                             │
                             ↓
         Prisma: INSERT Plan { admin.id, ... }
                             │
                             ↓
          Plan Stored in Database ✅
                             │
                             │
                             │ LATER: DISTRIBUTOR VIEWS PROFILE
                             │
                             ↓
         GET /api/auth/me (Distributor token)
         Response: User { id, name, ..., parentId }
                             │
                             ↓
        Profile Component Loads
        loadParentPlans() Called
                             │
                             ↓
        GET /api/users/{parentId}
         (parentId = admin.id)
                             │
                             ↓
        Returns: User { id: admin.id, role: SUPER_ADMIN, ... }
                             │
                             ↓
        Check: Is parent DISTRIBUTOR || SUPER_ADMIN?  ✅ YES
                  (Before fix: Only DISTRIBUTOR, so skipped)
                             │
                             ↓
        GET /api/plans/distributor/{admin.id}
                             │
                             ↓
        Backend: SELECT * FROM Plan WHERE distributorId = admin.id
                             │
                             ↓
        Returns: [
          { id: 1, name: "Premium", credits: 500, price: 5000 },
          { id: 2, name: "Starter", credits: 100, price: 1000 }
        ]
                             │
                             ↓
        Frontend: setParentUser({
          ...admin,
          plans: [...]
        })
                             │
                             ↓
        UI Renders: Purchase Credits → Available Plans ✅
        Displays each plan in grid format
                             │
                             ↓
        User Interaction: Click "Premium" plan
                             │
                             ↓
        setRequestForm({ amount: 500, ... })
        "Credits Needed" field shows: 500
                             │
                             ↓
        Submit: POST /api/transactions/request
        { amount: 500, txnId: "UPI-..." }
                             │
                             ↓
        Purchase Request Created ✅
```

---

## Before & After Comparison

### BEFORE FIX (❌ Plans Not Visible)

```
Distributor Profile → Purchase Credits
┌─────────────────────────────────────────┐
│ 1. Make Payment To:                     │
│    Admin HQ [Payment Info + QR]         │
│                                         │
│ 2. Available Plans:                     │
│    (EMPTY - No plans shown!)     ❌     │
│                                         │
│ 3. Submit Request:                      │
│    Credits Needed: ___                  │
│    Transaction ID: ___                  │
└─────────────────────────────────────────┘

Reason: loadParentPlans() Line 60
  if (parentResponse.data.role === UserRole.DISTRIBUTOR)
     └─ Only checks for DISTRIBUTOR
     └─ Admin is SUPER_ADMIN
     └─ Condition fails, plans not loaded ❌
```

### AFTER FIX (✅ Plans Visible)

```
Distributor Profile → Purchase Credits
┌─────────────────────────────────────────┐
│ 1. Make Payment To:                     │
│    Admin HQ [Payment Info + QR]         │
│                                         │
│ 2. Available Plans:                  ✅ │
│    ┌─────────────────┬──────────────┐  │
│    │ Premium         │ Starter      │  │
│    │ 500 Credits     │ 100 Credits  │  │
│    │ ₹5000           │ ₹1000        │  │
│    └─────────────────┴──────────────┘  │
│                                         │
│ 3. Submit Request:                      │
│    Credits Needed: 500 (auto-filled)   │
│    Transaction ID: ___                  │
└─────────────────────────────────────────┘

Fix: loadParentPlans() Line 60
  if (parentResponse.data.role === UserRole.DISTRIBUTOR 
      || parentResponse.data.role === UserRole.SUPER_ADMIN)
     └─ Now checks for both roles
     └─ Admin is SUPER_ADMIN
     └─ Condition passes, plans loaded ✅
```

---

## Database Schema Relationships

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Table (Simplified)                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ id              | UUID                                                 │ │
│  │ name            | String                                               │ │
│  │ email           | String (UNIQUE)                                      │ │
│  │ role            | UserRole (SUPER_ADMIN | DISTRIBUTOR | RETAILER)     │ │
│  │ parentId        | UUID or NULL                                         │ │
│  │ plans           | Plan[] (One-to-many relationship)                   │ │
│  │ credits         | Credits object (total, used, available)             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                            │                                                  │
│                            ├─ One-to-many ────────────────┐                   │
│                            │                              │                   │
│                            ↓                              ↓                   │
│                                                                              │
│  Plan Table                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ id              | UUID                                                 │ │
│  │ distributorId   | UUID (Foreign Key → User.id)  ← KEY FIELD!         │ │
│  │ name            | String                                               │ │
│  │ credits         | Integer                                              │ │
│  │ price           | Integer                                              │ │
│  │ createdAt       | DateTime                                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Index: distributorId                                                        │
│  └─ Used in: GET /api/plans/distributor/{distributorId}                     │
│  └─ Works for: Admin plans, Distributor plans, and any parent plans         │
│                                                                              │
│  Query Examples:                                                             │
│  ├─ Find admin's plans: WHERE distributorId = admin.id ✅                   │
│  ├─ Find distributor's plans: WHERE distributorId = distributor.id ✅      │
│  └─ Find by parent ID: WHERE distributorId = parent.id ✅                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          API ENDPOINTS                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CREATE PLAN (Admin creates for distributors)                            │
│     ┌────────────────────────────────────────────────────────────────────┐ │
│     │ POST /api/plans                                                    │ │
│     │ {                                                                  │ │
│     │   "name": "Premium",                                               │ │
│     │   "credits": 500,                                                  │ │
│     │   "price": 5000                                                    │ │
│     │ }                                                                  │ │
│     │                                                                    │ │
│     │ Backend (Line 49):                                                 │ │
│     │   distributorId: req.user.userId  (Admin's ID)                    │ │
│     │                                                                    │ │
│     │ Response:                                                          │ │
│     │ {                                                                  │ │
│     │   "success": true,                                                 │ │
│     │   "data": {                                                        │ │
│     │     "id": "uuid",                                                  │ │
│     │     "distributorId": "admin-id",                                   │ │
│     │     "name": "Premium",                                             │ │
│     │     "credits": 500,                                                │ │
│     │     "price": 5000                                                  │ │
│     │   }                                                                │ │
│     │ }                                                                  │ │
│     └────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  2. FETCH PLANS BY DISTRIBUTOR ID                                           │
│     ┌────────────────────────────────────────────────────────────────────┐ │
│     │ GET /api/plans/distributor/{distributorId}                         │ │
│     │                                                                    │ │
│     │ Parameters:                                                        │ │
│     │   distributorId = "admin-id" (Can be any parent's ID)            │ │
│     │                                                                    │ │
│     │ Backend Query:                                                    │ │
│     │   SELECT * FROM Plan                                              │ │
│     │   WHERE distributorId = {id}                                      │ │
│     │   ORDER BY createdAt DESC                                         │ │
│     │                                                                    │ │
│     │ Response:                                                          │ │
│     │ {                                                                  │ │
│     │   "success": true,                                                 │ │
│     │   "data": [                                                        │ │
│     │     {                                                              │ │
│     │       "id": "uuid1",                                               │ │
│     │       "distributorId": "admin-id",                                 │ │
│     │       "name": "Premium",                                           │ │
│     │       "credits": 500,                                              │ │
│     │       "price": 5000                                                │ │
│     │     },                                                             │ │
│     │     {                                                              │ │
│     │       "id": "uuid2",                                               │ │
│     │       "distributorId": "admin-id",                                 │ │
│     │       "name": "Starter",                                           │ │
│     │       "credits": 100,                                              │ │
│     │       "price": 1000                                                │ │
│     │     }                                                              │ │
│     │   ]                                                                │ │
│     │ }                                                                  │ │
│     └────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  KEY POINT: This endpoint is role-agnostic                                  │
│  └─ Works for Admin plans: /api/plans/distributor/{admin-id}               │
│  └─ Works for Distributor plans: /api/plans/distributor/{dist-id}         │
│  └─ Works for any parent: /api/plans/distributor/{parent-id}              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Code Execution Path - Fixed Version

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTOR LOADS PROFILE                                │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ↓
            Profile Component Mounts
                             │
                             ├─ useState: user = Distributor object
                             │  (contains: id, role: DISTRIBUTOR, parentId: admin-id)
                             │
                             ├─ useState: parentUser = undefined
                             ├─ useState: myPlans = []
                             │
                             ↓
            useEffect Hooks Triggered
                             │
                             ├─ useEffect 1 (Lines 110-114): Load distributor's plans
                             │  └─ loadMyPlans() → getPlansByDistributor(user.id)
                             │     └─ Fetches plans created BY this distributor
                             │        (used in "Manage Plans for Retailers" section)
                             │
                             ├─ useEffect 2 (Lines 117-119): Load parent user
                             │  └─ loadParentPlans() Starts Here ↓
                             │
                             ↓
            Check Condition: user.parentId && user.role !== SUPER_ADMIN
                             │
                             ├─ user.parentId = "admin-id" ✅
                             ├─ user.role = DISTRIBUTOR ✅
                             │
                             ↓
            API Call: GET /api/users/{parent-id}
                             │
                             ↓
            Backend Returns Parent User
            {
              id: "admin-id",
              role: "SUPER_ADMIN",  ← THIS IS KEY
              plans: undefined     (not fetched yet)
            }
                             │
                             ↓
            setParentUser(parentResponse.data)
                             │
                             ↓
            Check: parent.role === DISTRIBUTOR || parent.role === SUPER_ADMIN?
                             │
                     Before Fix: FAILS ❌
                     └─ parent.role = "SUPER_ADMIN"
                     └─ Condition only checks DISTRIBUTOR
                     └─ Plans not fetched
                     │
                     After Fix: PASSES ✅
                     └─ parent.role = "SUPER_ADMIN"
                     └─ Condition checks both DISTRIBUTOR and SUPER_ADMIN
                     └─ Plans fetched
                             │
                             ↓
            API Call: GET /api/plans/distributor/{admin-id}
                             │
                             ↓
            Backend Query:
            SELECT * FROM Plan WHERE distributorId = "admin-id"
                             │
                             ↓
            Returns Admin's Plans:
            [
              { id: 1, name: "Premium", credits: 500, price: 5000 },
              { id: 2, name: "Starter", credits: 100, price: 1000 }
            ]
                             │
                             ↓
            setParentUser(prev => ({
              ...prev,
              plans: [...]  ← Plans added to parent user object
            }))
                             │
                             ↓
            UI Renders: Purchase Credits Section
                             │
                             ├─ Step 1: Admin HQ Payment Info ✅
                             ├─ Step 2: Available Plans (NEWLY VISIBLE) ✅
                             │  ├─ Premium: 500 Credits - ₹5000
                             │  └─ Starter: 100 Credits - ₹1000
                             ├─ Step 3: Submit Request Form ✅
                             │
                             ↓
            Distributor Can Now:
            1. View admin's available plans
            2. Click a plan to pre-fill credit amount
            3. Submit purchase request for credits
```

---

## Summary

### What Changed
- **File:** Profile.tsx, Line 60
- **Before:** Only DISTRIBUTOR parents load plans
- **After:** Both DISTRIBUTOR and SUPER_ADMIN parents load plans

### Why It Matters
- Creates symmetric hierarchy: parents → children can see plans
- Distributors can now see admin-created plans
- Maintains consistent user experience across levels

### Impact
- ✅ Low risk (1 line change)
- ✅ No breaking changes
- ✅ Backward compatible
- ✅ No database changes needed
- ✅ No API changes needed

