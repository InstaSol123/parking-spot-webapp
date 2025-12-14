# Sample Data for All Three Panels

Sample data has been added to the database so you can see how the application works and understand the system capabilities. This document explains what data is available in each panel and how to access it.

---

## Access Information

### Application URL
```
https://qr.mytesting.cloud
```

### Test Credentials

Three user accounts have been created with different roles:

#### 1. Super Admin
```
Email:    admin@admin.com
Password: admin
Role:     SUPER_ADMIN
```

#### 2. Distributor
```
Email:    dist@dist.com
Password: admin
Role:     DISTRIBUTOR
Parent:   Super Admin
```

#### 3. Retailer
```
Email:    retailer@ret.com
Password: admin
Role:     RETAILER
Parent:   Distributor
```

---

## Super Admin Panel

### Available Features
The Super Admin user can access all 9 tabs:
- Dashboard
- User Management
- QR Management
- Database
- Financial Reports
- Notifications
- Roles & Permissions
- Settings
- Profile

### Sample Data Available

#### Users
- **Admin User** (Super Admin) - admin@admin.com
- **Distributor User** (Distributor) - dist@dist.com
- **Retailer User** (Retailer) - retailer@ret.com

Credits:
- Super Admin: 1,000 credits
- Distributor: 500 credits
- Retailer: 100 credits

#### QR Codes
- **Total: 20 QR codes**
- 6+ codes in ACTIVATED status
- 14+ codes in AVAILABLE status
- Used for demonstration of QR management capabilities

### What You Can Do
1. Click on **User Management** to view all users in the system
2. Click on **QR Management** to see all generated QR codes
3. Click on **Financial Reports** to view system-wide financial data
4. Click on **Database** to see system information
5. Click on **Settings** to manage system configuration
6. Manage roles and permissions in **Roles & Permissions**
7. View notifications in **Notifications**

---

## Distributor Panel

### Available Features
The Distributor user can access 4 tabs:
- Dashboard
- User Management
- Financial Reports
- Profile

### Sample Data Available

#### Users Managed
- **Retailer User** (child of this distributor)
- View the hierarchy showing parent-child relationships

#### Financial Data
- Credits: 500 total
- View financial transactions and credit usage
- Manage retailers under the distributor

#### Credits Information
- Initial: 500 credits
- Used: Varies based on operations
- Available: Calculated balance

### What You Can Do
1. Click on **User Management** to see retailers assigned to this distributor
2. Click on **Financial Reports** to view transaction history and credits
3. View the distributor's profile and business information
4. Monitor credit usage and balance

---

## Retailer Panel

### Available Features
The Retailer user can access 3 tabs:
- Dashboard
- QR Management
- Profile

### Sample Data Available

#### QR Codes
- **20 QR codes available**
- Each code has a unique identifier
- Status information (ACTIVATED or AVAILABLE)
- Activation timestamps

#### Credits
- Total: 100 credits
- Used for activating QR codes and services

### What You Can Do
1. Click on **QR Management** to view and manage QR codes
2. Activate QR codes for customer use
3. View activation history
4. Monitor credit balance in dashboard
5. View profile information

---

## Sample Data Details

### User Hierarchy

```
Admin User (SUPER_ADMIN)
├── admin@admin.com
├── Role: SUPER_ADMIN
├── Credits: 1,000
│
└── Distributor User (DISTRIBUTOR)
    ├── dist@dist.com
    ├── Role: DISTRIBUTOR
    ├── Credits: 500
    │
    └── Retailer User (RETAILER)
        ├── retailer@ret.com
        ├── Role: RETAILER
        └── Credits: 100
```

### QR Codes Distribution

| Status | Count |
|--------|-------|
| ACTIVATED | 6+ |
| AVAILABLE | 14+ |
| **Total** | **20** |

### Financial Transactions

Transactions have been created for the Distributor showing:
- Initial credit purchases (CREDIT type)
- Service usage (DEBIT type)
- Credit adjustments and bonuses
- Transaction approval status

---

## How to Navigate and Test

### Step 1: Login to Super Admin
1. Go to https://qr.mytesting.cloud
2. Enter: `admin@admin.com` / `admin`
3. Click Login

### Step 2: Explore Super Admin Features
- **User Management Tab**: See all 3 users in the system
  - View user names, emails, roles
  - See parent-child relationships
  - Check credit balances
  
- **QR Management Tab**: View 20 generated QR codes
  - See QR code status (ACTIVATED/AVAILABLE)
  - View activation details
  - Check QR code history

- **Financial Reports Tab**: Monitor system finances
  - View all transactions
  - Track credit movements
  - Monitor distributor and retailer credits

### Step 3: Login as Distributor
1. Logout and login with: `dist@dist.com` / `admin`
2. Notice the sidebar now shows only 4 tabs:
   - Dashboard
   - User Management
   - Financial Reports
   - Profile

3. **User Management**: See the 1 retailer under your management
4. **Financial Reports**: View your transactions and credit balance

### Step 4: Login as Retailer
1. Logout and login with: `retailer@ret.com` / `admin`
2. Notice the sidebar now shows only 3 tabs:
   - Dashboard
   - QR Management
   - Profile

3. **QR Management**: View the 20 QR codes available
4. **Dashboard**: See credit balance and important information

---

## Understanding Role-Based Access

The application implements role-based access control:

### Super Admin
- Full access to all features
- Can manage users, QR codes, finances, roles
- Can view system database and settings
- Can manage notifications
- Can configure roles and permissions

### Distributor
- Can manage retailers (users) under them
- Can view financial reports and transaction history
- Limited to their own business operations
- Cannot access system-level settings
- Cannot manage QRs directly

### Retailer
- Can manage QR codes
- Can activate and use QR codes
- Can view their own profile
- Cannot access user management
- Cannot access financial reports at system level

---

## Features to Explore

### User Management
- View hierarchical structure
- See parent-child relationships
- Check credit information
- Monitor user roles

### QR Management
- View all generated QR codes
- See QR status (ACTIVATED/AVAILABLE)
- View activation timeline
- Check QR code metadata

### Financial Reports
- Track credit movements
- View transaction history
- Monitor account balance
- See credit usage patterns

### Dashboard
- Quick overview of key metrics
- User information
- Credit balance
- Recent activity

---

## Testing Recommendations

1. **Login with each role** to see different sidebar configurations
2. **Navigate each tab** to understand role permissions
3. **Compare data visibility** between roles
4. **Examine sample QR codes** to understand QR management
5. **Review financial transactions** to see credit tracking
6. **Check user hierarchy** to understand parent-child relationships

---

## Sample Data Endpoints (API)

If you want to check the data programmatically:

### Get Users
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer <token>"
```

### Get QR Codes
```bash
curl -X GET http://localhost:5000/api/qrs \
  -H "Authorization: Bearer <token>"
```

### Get Transactions
```bash
curl -X GET http://localhost:5000/api/transactions \
  -H "Authorization: Bearer <token>"
```

---

## Notes

- All sample data is stored in PostgreSQL database
- Data persists until database is reset
- You can add more data through the application UI
- Each role has restricted data visibility for security
- Transactions are logged and timestamped
- QR codes have unique identifiers for tracking

---

## Next Steps

1. ✅ Login with each role to see different interfaces
2. ✅ Explore each tab and understand available features
3. ✅ View the sample data in the application
4. ✅ Test role-based access control
5. ✅ Understand the user hierarchy
6. ✅ Review financial tracking capabilities

The application is now **ready for comprehensive testing** with realistic sample data!

---

**Created**: December 12, 2025  
**Status**: Sample data successfully seeded and tested  
**Data Integrity**: Verified and operational
