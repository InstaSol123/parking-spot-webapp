# Parking Spot - Complete Architecture Documentation

## System Overview

The Parking Spot application has been converted from a frontend-only mock application into a fully functional backend-powered web application. This document outlines the complete architecture, database design, API structure, and security implementation.

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Port**: 5173
- **Styling**: Tailwind CSS
- **UI Components**: lucide-react
- **Routing**: React Router DOM v7
- **QR Code**: qrcode.react, html5-qrcode
- **Charts**: Recharts
- **API Client**: Fetch API with custom ApiService class

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (TypeScript)
- **Port**: 5000
- **Database**: PostgreSQL 12+
- **ORM**: Prisma
- **Authentication**: JWT with bcryptjs
- **Utilities**: Express CORS, UUID generation

### Database
- **Engine**: PostgreSQL 15+ (recommended)
- **Schema**: Prisma ORM managed
- **Relationships**: Full relational integrity
- **Type Safety**: Generated Prisma types

## Database Schema

### Core Entities

#### User Model
Represents all users in the system (Admin, Distributor, Retailer)

```
User
├── id: UUID (Primary Key)
├── name: String
├── businessName: String (optional)
├── email: String (Unique)
├── mobile: String
├── password: String (bcrypt hashed)
├── role: Enum (ADMIN, DISTRIBUTOR, RETAILER)
├── partnerId: String (Unique, 8-digit)
├── parentId: UUID (Foreign Key - User hierarchy)
├── address: String (optional)
├── aadhaar: String (optional)
├── pan: String (optional)
├── gst: String (optional)
├── msme: String (optional)
├── paymentDetails: String (optional, for distributors)
├── paymentQr: String (optional, base64 image)
├── createdAt: DateTime
├── Relationships:
│   ├── parent: User (self-reference)
│   ├── children: User[] (self-reference)
│   ├── accessRole: AccessRole
│   ├── credits: Credits (1:1)
│   ├── creditLogs: CreditLog[] (1:N)
│   ├── sentTransactions: Transaction[] (1:N)
│   ├── receivedTransactions: Transaction[] (1:N)
│   ├── plans: Plan[] (1:N)
│   └── activatedQRs: QRCodeData[] (1:N)
```

#### Credits Model
Tracks credit balance and metrics for each user

```
Credits
├── id: UUID (Primary Key)
├── userId: UUID (Unique Foreign Key)
├── total: Integer (total credits ever received)
├── used: Integer (credits deducted for activations/sales)
├── available: Integer (total - used)
├── createdAt: DateTime
├── updatedAt: DateTime
└── Relationship:
    └── user: User (1:1)
```

#### CreditLog Model
Immutable audit trail of all credit transactions

```
CreditLog
├── id: UUID (Primary Key)
├── userId: UUID (Foreign Key)
├── type: Enum (ADD, SUBTRACT, ACTIVATION, GRANT)
├── amount: Integer
├── reason: String
├── relatedUserId: UUID (optional, who sent/received)
├── relatedUserName: String (optional)
├── createdAt: DateTime
└── Relationship:
    └── user: User (1:N)
```

#### QRCodeData Model
Represents individual QR codes with activation details

```
QRCodeData
├── id: UUID (Primary Key)
├── code: String (Unique, 12-char random)
├── serialNumber: String (Unique, SR000001 format)
├── generationDate: DateTime
├── status: Enum (UNUSED, ACTIVE)
├── plan: Enum (FREE, PAID_MASKED)
├── subscriptionPlanId: UUID (Foreign Key, optional)
├── subscriptionPlanName: String
├── ownerName: String (optional)
├── ownerMobile: String (optional)
├── ownerEmail: String (optional)
├── ownerAddress: String (optional)
├── vehicleNumber: String (optional)
├── aadhaar: String (optional)
├── pan: String (optional)
├── activatedById: UUID (Foreign Key, optional)
├── activatedAt: DateTime (optional)
├── transactionId: String (optional, payment reference)
├── createdAt: DateTime
└── Relationships:
    ├── subscriptionPlan: SubscriptionPlan
    └── activatedBy: User
```

#### SubscriptionPlan Model
Available subscription plans (Free, Paid Masked)

```
SubscriptionPlan
├── id: UUID (Primary Key)
├── name: String (Unique)
├── type: Enum (FREE, PAID_MASKED)
├── price: Integer (in paise)
├── validityDays: Integer (365 for yearly)
├── description: String
├── createdAt: DateTime
└── Relationship:
    └── qrCodes: QRCodeData[] (1:N)
```

#### Transaction Model
Credit transfer requests and approvals

```
Transaction
├── id: UUID (Primary Key)
├── fromUserId: UUID (Foreign Key)
├── fromUserName: String
├── toUserId: UUID (Foreign Key)
├── amount: Integer (credits)
├── txnId: String (UPI/payment reference)
├── status: Enum (PENDING, APPROVED, REJECTED)
├── createdAt: DateTime
├── updatedAt: DateTime
└── Relationships:
    ├── fromUser: User (1:N)
    └── toUser: User (1:N)
```

#### AccessRole Model
Fine-grained role-based access control

```
AccessRole
├── id: UUID (Primary Key)
├── name: String (Unique)
├── description: String
├── isSystem: Boolean (cannot delete if true)
├── createdAt: DateTime
└── Relationships:
    ├── permissions: Permission[] (1:N)
    └── users: User[] (1:N)
```

#### Permission Model
Granular resource-action permissions

```
Permission
├── id: UUID (Primary Key)
├── roleId: UUID (Foreign Key)
├── resource: String (users, qrs, settings, etc.)
├── actions: String (comma-separated: view,create,edit,delete)
├── createdAt: DateTime
└── Relationship:
    └── role: AccessRole (1:N)
```

#### Notification Model
System-wide broadcast messages

```
Notification
├── id: UUID (Primary Key)
├── title: String
├── message: String
├── targetRole: String (ALL, DISTRIBUTOR, RETAILER)
├── createdAt: DateTime
```

#### SystemSettings Model
Configuration and API keys

```
SystemSettings
├── id: UUID (Primary Key)
├── smsApiKey: String (optional)
├── maskedCallApiKey: String (optional)
├── adminPaymentInfo: String
├── adminPaymentQr: String (base64 image)
├── supportEmail: String
├── supportPhone: String
├── logoUrl: String
├── updatedAt: DateTime
```

#### SMSTemplate & Plan Models
Pre-defined messaging and distributor pricing

```
SMSTemplate
├── id: UUID
├── text: String (Unique)

Plan
├── id: UUID
├── distributorId: UUID
├── name: String
├── credits: Integer
├── price: Integer (retail price)
```

## API Architecture

### Authentication Flow

```
1. User Registration/Login
   └── POST /api/auth/register or /api/auth/login
       ├── Credentials validated
       ├── JWT token generated (30-day expiry)
       └── Token returned to client

2. Client stores token in localStorage
   └── All subsequent requests include: Authorization: Bearer <token>

3. Server validates token on every protected route
   └── Middleware extracts and verifies JWT
       ├── Valid: Request proceeds with user context
       └── Invalid: 401 Unauthorized response
```

### Request/Response Format

All API responses follow a consistent structure:

```json
{
  "success": true/false,
  "data": { /* actual response data */ },
  "message": "optional success message",
  "error": "optional error message"
}
```

### Error Handling

```
HTTP Status Codes:
├── 200: OK (GET, PUT successful)
├── 201: Created (POST successful)
├── 400: Bad Request (invalid input)
├── 401: Unauthorized (missing/invalid token)
├── 403: Forbidden (insufficient permissions)
├── 404: Not Found (resource doesn't exist)
└── 500: Internal Server Error
```

## Security Implementation

### Password Security
- All passwords hashed with bcryptjs (salt rounds: 10)
- Never stored in plain text
- Comparison uses timing-safe bcrypt.compare()

### JWT Tokens
- Secret key: configurable via JWT_SECRET env var
- Payload: userId, email, role
- Expiry: 30 days
- Algorithm: HS256

### CORS Protection
- Only requests from FRONTEND_URL accepted
- Credentials allowed (for cookies)
- Standard headers: Content-Type, Authorization

### SQL Injection Prevention
- All queries use Prisma parameterized queries
- No raw SQL in codebase

### Rate Limiting (Recommended)
- Add express-rate-limit for production
- Limit: 100 requests per 15 minutes per IP

### HTTPS (Production)
- Enable SSL/TLS on production server
- Secure flag on JWT cookies
- HSTS headers

## User Hierarchy & Workflow

### Admin (Super Admin)
```
Permissions:
  - Generate QR codes
  - View all users (distributors)
  - Create/manage subscription plans
  - Manage system settings
  - Broadcast notifications
  - Approve distributor credit requests
  - Create custom roles (with restrictions)

Workflow:
  1. Creates subscription plans (Free, Paid)
  2. Approves distributor credit requests
  3. Manages system configuration
  4. Receives credit sales logs
```

### Distributor
```
Permissions:
  - Create retailers
  - Sell credits to retailers
  - View financials/sales
  - Track activations by retailers
  - Set custom pricing for retailers

Workflow:
  1. Request credits from admin (with payment proof)
  2. Receive credit approval
  3. Create retailers under their account
  4. Sell credits to retailers
  5. Retailers activate QRs using those credits
  6. Track revenue and activations
```

### Retailer
```
Permissions:
  - View assigned QR codes
  - Activate QRs (1 credit per activation)
  - Update owner details
  - Request credits from parent distributor
  - View transaction history

Workflow:
  1. Get assigned QR codes from distributor
  2. Collect customer information
  3. Select subscription plan
  4. Activate QR (deducts 1 credit)
  5. Monitor credit balance
  6. Request additional credits when needed
```

## QR Code Lifecycle

```
Creation (Admin Only):
  └── POST /api/qrs/generate
      ├── Generate unique code (random 12 chars)
      ├── Serial number (SR000001, SR000002, ...)
      ├── Status: UNUSED
      ├── Plan: FREE
      └── Store in database

Distribution:
  └── Admin/Distributor assigns to retailers

Activation (Retailer):
  └── POST /api/qrs/{id}/activate
      ├── Check retailer has ≥1 credit
      ├── Collect owner details:
      │   ├── Name, mobile, email
      │   ├── Address, vehicle number
      │   ├── Aadhaar, PAN (optional)
      ├── Select subscription plan
      ├── Record payment transaction ID
      ├── Deduct 1 credit from retailer
      ├── Set status: ACTIVE
      ├── Record activation timestamp
      └── Log credit transaction

Public Use (QR Scanner):
  └── GET /api/qrs/code/{code}
      ├── Find QR by code
      ├── Check if ACTIVE
      ├── Return owner details + plan type
      ├── If plan == PAID_MASKED:
      │   └── Show privacy notice before calling
      └── If plan == FREE:
          └── Show direct number

Owner Update:
  └── PUT /api/qrs/{id}/owner
      └── Update owner details anytime
```

## Credit & Transaction System

### Credit Flow

```
Admin Creates Credits:
  └── Infinite pool (represented by role permission)

Distributor Request:
  └── POST /api/transactions/request
      ├── Amount: 10-1000 credits
      ├── Transaction ID: UPI reference
      ├── Status: PENDING

Admin Approval:
  └── POST /api/transactions/{id}/approve
      ├── Admin verifies payment in bank
      ├── Distributor receives credits
      ├── CreditLog created (GRANT type)

Retailer Request:
  └── POST /api/transactions/request
      ├── Amount: 1-100 credits
      ├── To: Parent distributor
      ├── Status: PENDING

Distributor Approval:
  └── POST /api/transactions/{id}/approve
      ├── Check distributor has credits
      ├── Deduct from distributor
      ├── Add to retailer
      ├── Create logs (SUBTRACT, ADD)

QR Activation:
  └── Each activation = -1 credit
      ├── CreditLog type: ACTIVATION
      └── Used count incremented
```

### Credit Metrics

```
total:     Total credits ever received
used:      Credits spent on activations + sales
available: total - used (can only spend this amount)
```

## Notification System

### Broadcast Flow

```
Admin Creates Notification:
  └── POST /api/notifications
      ├── Title, message
      ├── Target role: ALL, DISTRIBUTOR, or RETAILER
      └── Store in database

User Retrieves Notifications:
  └── GET /api/notifications
      ├── Filter by user.role
      ├── Include all "ALL" notifications
      ├── Sort by createdAt DESC
      └── Return to frontend

Admin Deletes Notification:
  └── DELETE /api/notifications/{id}
      └── Remove from database
```

## Frontend Integration

### API Service Class

Located in `src/services/api.ts`, provides methods for all backend operations:

```typescript
class ApiService {
  // Authentication
  login(email, password)
  register(data)
  getCurrentUser()

  // Users
  getUsers()
  getUser(id)
  createUser(data)
  updateUser(id, data)
  getUserChildren(id)

  // QRs
  generateQRs(quantity)
  getQRs(filters)
  getQRByCode(code)
  activateQR(id, data)
  updateQROwner(id, data)

  // Transactions
  requestCredits(amount, txnId)
  getPendingTransactions()
  getMyTransactions()
  approveTransaction(id)
  rejectTransaction(id)

  // Notifications, Roles, Settings, Subscriptions
  // ... (40+ methods total)
}
```

### Component Integration

Components updated to use api service:

```typescript
// Before (mockService)
const users = db.getAllUsers();

// After (API)
const response = await api.getUsers();
const users = response.data;
```

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────┐
│         Development Machine                 │
├─────────────────────────────────────────────┤
│                                             │
│  Frontend (Port 5173)    Backend (Port 5000)│
│  ├─ React dev server     ├─ Express.js      │
│  ├─ Hot reload           ├─ Hot reload      │
│  └─ Vite               └─ tsx-node          │
│          │                      │            │
│          └──────────────────────┘            │
│          HTTP requests/responses             │
│                  │                           │
│                  ▼                           │
│         PostgreSQL (Port 5432)              │
│         ├─ Development database             │
│         └─ Prisma migrations                │
│                                             │
└─────────────────────────────────────────────┘
```

### Production Environment

```
┌────────────────────────────────────────────────────┐
│         Production Server (AWS/Heroku/etc)         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Frontend (Static)        Backend (Port 5000)     │
│  ├─ React build           ├─ Node.js process     │
│  ├─ Served by Nginx       ├─ PM2/systemd        │
│  └─ Minified JS/CSS       └─ Environment vars    │
│          │                       │                │
│          ├───────────────────────┤                │
│          │  HTTPS (nginx proxy)  │                │
│          └───────────────────────┘                │
│                  │                                │
│                  ▼                                │
│    PostgreSQL (Managed Service)                   │
│    ├─ RDS/Cloud SQL/etc                          │
│    ├─ Automated backups                          │
│    └─ SSL/TLS encryption                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Performance Optimizations

### Database
- Indexes on frequently queried fields (userId, status, code)
- Connection pooling via Prisma
- Query optimization with select/include

### API
- JWT caching in middleware
- Response compression via gzip
- Pagination (recommended for user lists)

### Frontend
- Code splitting with Vite
- Lazy component loading
- Asset optimization

## Testing Strategy

### Unit Tests (Backend)
```
✓ Auth: Login, register, token validation
✓ Users: CRUD, hierarchy checks
✓ QRs: Generation, activation, owner updates
✓ Transactions: Request, approve, reject
✓ Permissions: Resource checking
```

### Integration Tests
```
✓ End-to-end: User flow from registration to QR activation
✓ Credit flow: Request → Approve → Spend
✓ Notification: Create → Broadcast → Retrieve
```

### Manual Testing (Using Frontend UI)
```
✓ Login with different role accounts
✓ Generate QRs and verify serial numbers
✓ Activate QR and check credit deduction
✓ Request credits and test approval flow
✓ Create custom roles with permissions
✓ Broadcast notifications to specific roles
```

## Monitoring & Logging (Recommended)

```
Backend Logs:
  - Winston or Pino for structured logging
  - Log level: debug, info, warn, error
  - Rotate logs daily

Monitoring:
  - PM2 Plus for process monitoring
  - DataDog/New Relic for APM
  - Sentry for error tracking

Alerts:
  - High error rate (>1%)
  - Database connection failures
  - API response time > 1 second
```

## Conclusion

This architecture provides a complete, production-ready backend for the Parking Spot application. All components are properly typed, secured, and follow industry best practices. The system supports multi-tier user hierarchies, role-based access control, credit management, and real-time notifications.

For setup and deployment instructions, see: BACKEND_SETUP.md
For quick start: Run `chmod +x setup.sh && ./setup.sh`
