# RBAC System Testing Documentation

## Test Plan

### Objective
Verify that the Role-Based Access Control (RBAC) system properly restricts custom role users to only their assigned permissions while maintaining full access for system administrators.

### Test Role Configuration
**Role Name:** Test Manager  
**Description:** Limited access for testing RBAC enforcement  
**Permissions:**
- Users: view, edit
- QRs: view, edit

**Expected Behavior:**
- ✅ CAN access User Management (view, edit)
- ✅ CAN access QR Management (view, edit)
- ❌ CANNOT create users (no 'create' permission)
- ❌ CANNOT delete users (no 'delete' permission)
- ❌ CANNOT create QRs (no 'create' permission)
- ❌ CANNOT delete QRs (no 'delete' permission)
- ❌ CANNOT access Settings (no permissions)
- ❌ CANNOT access Roles & Permissions (no permissions)
- ❌ CANNOT access Financial Reports (no permissions)
- ❌ CANNOT access Database/Customers (no permissions)
- ❌ CANNOT access Subscriptions (no permissions)
- ❌ CANNOT access Notifications Management (no permissions)

### Test Account
**Email:** testmanager@test.com  
**Password:** Test123456  
**Name:** Test Manager  

---

## Testing Procedure

### Phase 1: Account Creation
1. Log in as admin@admin.com
2. Navigate to Roles & Permissions
3. Click "Create Staff Account"
4. Fill in details:
   - Email: testmanager@test.com
   - Password: Test123456 (visible in plain text)
   - Role Name: Test Manager
   - Description: Limited access for testing RBAC enforcement
   - Permissions: Check only:
     - Users: view, edit
     - QRs: view, edit
5. Click "Create Account"
6. Verify credentials modal displays
7. Copy credentials
8. Close modal

### Phase 2: Frontend UI Testing
1. Log out from admin account
2. Log in as testmanager@test.com / Test123456
3. Verify sidebar visibility:
   - Dashboard (should be visible)
   - User Management (should be visible - has 'view')
   - QR Management (should be visible - has 'view')
   - Database (should be HIDDEN - no permissions)
   - Financial Reports (should be HIDDEN - no permissions)
   - Notifications (should be HIDDEN - no permissions)
   - Roles & Permissions (should be HIDDEN - no permissions)
   - Settings (should be HIDDEN - no permissions)
   - Profile (should be visible)

### Phase 3: Backend API Testing
Test each endpoint to verify proper permission enforcement:

#### User Management Tests
- ✅ GET /api/users (should SUCCEED - has 'view')
- ❌ POST /api/users (should FAIL 403 - no 'create')
- ✅ PUT /api/users/:id (should SUCCEED - has 'edit')
- ❌ DELETE /api/users/:id (should FAIL 403 - no 'delete')

#### QR Management Tests
- ✅ GET /api/qrs (should SUCCEED - has 'view')
- ❌ POST /api/qrs/generate (should FAIL 403 - no 'create')
- ✅ PUT /api/qrs/:id/owner (should SUCCEED - has 'edit')
- ❌ DELETE /api/qrs/:id (should FAIL 403 - no 'delete')

#### Settings Tests
- ❌ GET /api/settings (should FAIL 403 - no permissions)
- ❌ PUT /api/settings (should FAIL 403 - no permissions)

#### Roles Tests
- ❌ GET /api/roles (should FAIL 403 - no permissions)
- ❌ POST /api/roles (should FAIL 403 - no permissions)

#### Subscriptions Tests
- ❌ GET /api/subscriptions (should FAIL 403 - no permissions)
- ❌ POST /api/subscriptions (should FAIL 403 - no permissions)

#### Notifications Tests
- ✅ GET /api/notifications (should SUCCEED - all users can view)
- ❌ POST /api/notifications (should FAIL 403 - no permissions)
- ❌ DELETE /api/notifications/:id (should FAIL 403 - no permissions)

### Phase 4: Direct URL Access Testing
Try accessing restricted pages directly via URL:
- `/users` - Should show page (has permission)
- `/qrs` - Should show page (has permission)
- `/settings` - Should show 403 or redirect (no permission)
- `/roles` - Should show 403 or redirect (no permission)
- `/financials` - Should show 403 or redirect (no permission)
- `/customers` - Should show 403 or redirect (no permission)

### Phase 5: System Admin Testing
Log back in as admin@admin.com and verify:
- ✅ All sidebar items visible
- ✅ Can access all pages
- ✅ Can perform all actions
- ✅ Full system access maintained

---

## Test Results

### Test Execution Date: [To be filled after testing]

### Phase 1: Account Creation
- [ ] Role created successfully
- [ ] User account created successfully
- [ ] Credentials displayed in modal
- [ ] User ID shown with copy button
- [ ] Email shown with copy button
- [ ] Password shown with copy button
- [ ] "Copy All" button works
- [ ] Password was visible during creation

### Phase 2: Frontend UI Testing
- [ ] Login successful with test account
- [ ] Dashboard visible
- [ ] User Management visible
- [ ] QR Management visible
- [ ] Database HIDDEN
- [ ] Financial Reports HIDDEN
- [ ] Notifications HIDDEN
- [ ] Roles & Permissions HIDDEN
- [ ] Settings HIDDEN
- [ ] Profile visible

### Phase 3: Backend API Testing

#### User Management
- [ ] GET /api/users - SUCCESS (200)
- [ ] POST /api/users - BLOCKED (403)
- [ ] PUT /api/users/:id - SUCCESS (200)
- [ ] DELETE /api/users/:id - BLOCKED (403)

#### QR Management
- [ ] GET /api/qrs - SUCCESS (200)
- [ ] POST /api/qrs/generate - BLOCKED (403)
- [ ] PUT /api/qrs/:id - SUCCESS (200)

#### Restricted Resources
- [ ] GET /api/settings - BLOCKED (403)
- [ ] PUT /api/settings - BLOCKED (403)
- [ ] GET /api/roles - BLOCKED (403)
- [ ] POST /api/roles - BLOCKED (403)
- [ ] GET /api/subscriptions - BLOCKED (403)
- [ ] POST /api/subscriptions - BLOCKED (403)
- [ ] POST /api/notifications - BLOCKED (403)
- [ ] DELETE /api/notifications/:id - BLOCKED (403)

### Phase 4: Direct URL Access
- [ ] /users - Accessible
- [ ] /qrs - Accessible
- [ ] /settings - Blocked/Redirected
- [ ] /roles - Blocked/Redirected
- [ ] /financials - Blocked/Redirected
- [ ] /customers - Blocked/Redirected

### Phase 5: System Admin Verification
- [ ] Admin can see all sidebar items
- [ ] Admin can access all pages
- [ ] Admin can perform all actions
- [ ] No degradation in admin privileges

---

## Browser Console Logs

### Expected Success Log (when accessing permitted resource):
```
[RoleManagement] getRoles response: {...}
[RoleManagement] All roles: [...]
```

### Expected Denial Log (when accessing restricted resource):
```
POST https://qr.mytesting.cloud/api/roles 403 (Forbidden)
Error: Permission denied
```

---

## Backend Server Logs

### Expected Success Pattern:
```
[2025-12-13] INFO: HTTP Request: GET /api/users 200 5ms
```

### Expected Denial Pattern:
```
[Access Denied] User: <user-id>, Resource: roles, Action: view, Reason: Missing view permission on roles
[2025-12-13] INFO: HTTP Request: GET /api/roles 403 2ms
```

---

## Security Validation Checklist

### RBAC Enforcement
- [ ] Custom role user cannot access unauthorized resources
- [ ] Custom role user cannot perform unauthorized actions
- [ ] Backend properly validates permissions before processing requests
- [ ] Frontend hides UI elements for unauthorized resources
- [ ] Direct URL access to unauthorized pages is blocked
- [ ] Error messages do not leak sensitive information

### Permission Granularity
- [ ] 'view' permission allows read-only access
- [ ] 'create' permission is required for creation operations
- [ ] 'edit' permission is required for update operations
- [ ] 'delete' permission is required for deletion operations
- [ ] Missing permission results in 403 response

### System Integrity
- [ ] Admin user retains full access
- [ ] System roles (Super Admin, Standard Distributor, Standard Retailer) unchanged
- [ ] Permission checks don't impact system performance significantly
- [ ] User sessions properly maintain permission context
- [ ] Logout/login cycle properly refreshes permissions

---

## Conclusion

[To be filled after testing]

### Overall Assessment:
- RBAC System Status: [ ] PASS / [ ] FAIL
- Security Boundaries: [ ] PROPERLY ENFORCED / [ ] GAPS IDENTIFIED
- Recommendation: [ ] READY FOR PRODUCTION / [ ] REQUIRES FIXES

### Issues Identified:
1. [List any issues found]

### Recommendations:
1. [List any recommendations]

---

## Test Credentials Reference

**Admin Account:**
- Email: admin@admin.com
- Password: admin
- AccessRole: Super Admin
- Expected Behavior: Full access to all resources

**Test Manager Account:**
- Email: testmanager@test.com
- Password: Test123456
- AccessRole: Test Manager
- Permitted Resources: users (view, edit), qrs (view, edit)
- Expected Behavior: Limited access only to assigned permissions

---

## Next Steps

After successful testing:
1. Document any edge cases discovered
2. Create additional test roles for other permission combinations
3. Set up automated testing for permission checks
4. Implement monitoring for unauthorized access attempts
5. Train administrators on role management best practices
