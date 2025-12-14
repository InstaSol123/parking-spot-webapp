# Super Admin Configuration - Quick Reference

## System Overview
The Parking Spot application now uses a **SUPER_ADMIN** role as the top-level administrative account instead of just "ADMIN". This creates a clearer role hierarchy:

```
SUPER_ADMIN (Full access)
    ↓
DISTRIBUTOR (Partner access)
    ↓
RETAILER (User access)
```

## Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **SUPER_ADMIN** | admin@admin.com | admin | Full system access |
| **DISTRIBUTOR** | dist@dist.com | admin | Partner-level access |
| **RETAILER** | retailer@ret.com | admin | User-level access |

## Super Admin Capabilities

When you login as **admin@admin.com**, you have access to:

### Dashboard & Navigation
- ✅ Dashboard (overview)
- ✅ User Management (create/manage distributors)
- ✅ QR Management (generate QR codes)
- ✅ Database (view all customers, retailers, distributors)
- ✅ Financial Reports (revenue, transactions)
- ✅ Roles & Permissions (manage access roles)
- ✅ Settings (system configuration)
- ✅ Notifications (broadcast messages)
- ✅ Profile (personal settings)

### API Access
Super Admin can:
- Create, read, update, delete users
- Generate QR codes in bulk
- Modify system settings
- Create custom roles and assign permissions
- Send system notifications
- View all financial transactions
- Manage subscription plans

### Role Management
Three system roles exist:
1. **Super Admin** (accessRole) - All 7 resource permissions
2. **Standard Distributor** (accessRole) - Limited permissions
3. **Standard Retailer** (accessRole) - QR-only access

No custom roles are created by default, but Super Admin can create them.

## Key Database Changes

### User Roles
The application uses these user roles (in `UserRole` enum):
- `SUPER_ADMIN` - System administrator
- `DISTRIBUTOR` - Partner distributor
- `RETAILER` - End retailer

### Access Roles
Database stores detailed permissions in `AccessRole` table:
- `Super Admin` - Can do everything
- `Standard Distributor` - Can manage users and view financials
- `Standard Retailer` - Can activate QRs only

## Important Notes

### Migration from Previous Version
- Old "ADMIN" role references have been completely removed
- All code now uses "SUPER_ADMIN"
- Database was reset and reseeded (automatic on first run)
- No manual migration steps required

### API Endpoints
All protected endpoints check for `SUPER_ADMIN` role:
```
POST /api/roles                 → SUPER_ADMIN only
PUT /api/roles/:id             → SUPER_ADMIN only
DELETE /api/roles/:id          → SUPER_ADMIN only
POST /api/settings             → SUPER_ADMIN only
POST /api/notifications        → SUPER_ADMIN only
POST /api/qrs/generate         → SUPER_ADMIN only
```

### No Old "Admin" References
The system no longer has:
- ❌ UserRole.ADMIN
- ❌ 'ADMIN' string comparisons
- ❌ `/admin/` interface (still uses `/admin/notifications` route)

## Frontend Access

### Super Admin Dashboard
Login to http://localhost:5173 with admin@admin.com / admin

You'll see the full admin interface with all 7 management tabs.

### Super Admin Sidebar
```
PARKING SPOT
━━━━━━━━━━━━━━━━━━━━━━━
┌ Dashboard
├ User Management
├ QR Management
├ Database
├ Financial Reports
├ Notifications
├ Roles & Permissions
├ Settings
└ Profile
```

## System Architecture

### Three-Role Hierarchy
```
Admin User (admin@admin.com)
├── Role: SUPER_ADMIN (database role)
├── AccessRole: "Super Admin" (permissions)
└── Permissions: All 7 resources

Distributor User (dist@dist.com)
├── Role: DISTRIBUTOR
├── AccessRole: "Standard Distributor"
├── Permissions: users, financials, qrs
└── Parent: Admin User (ID-based hierarchy)

Retailer User (retailer@ret.com)
├── Role: RETAILER
├── AccessRole: "Standard Retailer"
├── Permissions: qrs (QR activation only)
└── Parent: Distributor User (ID-based hierarchy)
```

### Database Schema
User table has:
- `role` field (SUPER_ADMIN, DISTRIBUTOR, RETAILER)
- `accessRoleId` field (Foreign key to AccessRole)
- `parentId` field (For hierarchy: null for SUPER_ADMIN)

## Testing

### Verify SUPER_ADMIN Role
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin"}'

# Returns: "role": "SUPER_ADMIN"
```

### Verify System Roles
```bash
curl http://localhost:5000/api/roles \
  -H "Authorization: Bearer <admin_token>"

# Returns 3 roles: Super Admin, Standard Distributor, Standard Retailer
```

### Check Super Admin Permissions
```bash
curl http://localhost:5000/api/roles \
  -H "Authorization: Bearer <admin_token>" | \
  jq '.data[] | select(.name=="Super Admin") | .permissions'

# Returns 7 resource permissions
```

## Troubleshooting

### Still seeing "Admin" in code?
Search for:
- `UserRole.ADMIN` → Should be `UserRole.SUPER_ADMIN`
- `role === 'ADMIN'` → Should be `role === 'SUPER_ADMIN'`
- Check git diff for complete list of changes

### Login showing wrong role?
1. Restart backend: `npm run dev` in backend directory
2. Clear browser cache/localStorage
3. Try incognito window
4. Check database: `SELECT email, role FROM "User" WHERE email='admin@admin.com';`

### Missing permissions?
1. Verify user has `accessRoleId` set
2. Check AccessRole has required permissions
3. Restart backend to reseed if corrupted

## Files Modified

Complete list of files changed for SUPER_ADMIN migration:

**Frontend:**
- `types.ts` - UserRole enum
- `App.tsx` - Route permissions
- `components/Layout.tsx` - Sidebar visibility

**Backend:**
- `backend/prisma/schema.prisma` - UserRole enum
- `backend/src/index.ts` - User seeding
- `backend/src/routes/users.ts` - User API
- `backend/src/routes/roles.ts` - Role API
- `backend/src/routes/settings.ts` - Settings API
- `backend/src/routes/notifications.ts` - Notifications API
- `backend/src/routes/qrs.ts` - QR API
- `backend/src/routes/subscriptions.ts` - Subscriptions API

## Next Steps

### Customize Settings
As SUPER_ADMIN, you can:
1. Go to Settings tab
2. Update system configuration
3. Upload custom logo
4. Set payment information
5. Configure support contacts

### Create Custom Roles
1. Go to Roles & Permissions
2. Create new roles with specific permission combinations
3. Assign to new users

### Manage Distributors
1. Go to User Management
2. Create distributor accounts
3. Each distributor can then manage their own retailers

## Summary

✅ **SUPER_ADMIN** is now the only top-level administrator role
✅ System has exactly **3 user roles** (SUPER_ADMIN, DISTRIBUTOR, RETAILER)
✅ **7 resource permissions** available to Super Admin
✅ **3 access roles** for permission management
✅ **Proper hierarchy** maintained via parentId relationships
✅ **All endpoints** updated to check SUPER_ADMIN role
✅ **Frontend builds** successfully without errors

The Parking Spot application is now configured with a clear, maintainable SUPER_ADMIN role structure.
