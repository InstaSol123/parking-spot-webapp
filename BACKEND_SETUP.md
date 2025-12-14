# Parking Spot - Backend Setup Guide

## Overview

This is a complete backend-powered web application for the Parking Spot platform. The system includes:

- **Backend**: Node.js/Express API server on port 5000
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: React with Vite on port 5173
- **Authentication**: JWT-based
- **Architecture**: RESTful API with role-based access control

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ (installed and running)
- Git

## Project Structure

```
parking spot/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── index.ts      # Main server entry point
│   │   ├── lib/
│   │   │   └── prisma.ts # Database client
│   │   ├── types/
│   │   │   └── index.ts  # TypeScript types
│   │   ├── utils/
│   │   │   └── auth.ts   # JWT utilities
│   │   └── routes/       # API endpoints
│   │       ├── auth.ts
│   │       ├── users.ts
│   │       ├── qrs.ts
│   │       ├── transactions.ts
│   │       ├── notifications.ts
│   │       ├── roles.ts
│   │       ├── settings.ts
│   │       └── subscriptions.ts
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── src/                  # React frontend
│   ├── services/
│   │   ├── api.ts        # API client
│   │   └── mockService.ts # Legacy (no longer used)
│   ├── components/
│   ├── types.ts
│   ├── App.tsx
│   └── index.tsx
├── vite.config.ts        # Frontend build config
└── package.json          # Frontend dependencies
```

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database for the project:

```bash
# Using psql command line
createdb parking_spot

# Or using your database GUI tool
# Create a new database named "parking_spot"
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/parking_spot"
# JWT_SECRET="your-secret-key-change-in-production"
nano .env

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates database tables)
npm run prisma:migrate

# Start the backend server
npm run dev

# Backend will be available at http://localhost:5000
```

### 3. Frontend Setup

Open a NEW terminal window and run:

```bash
# Navigate to frontend directory (root of project)
cd /home/owner/parking\ spot

# Install dependencies
npm install

# Start the development server
npm run dev

# Frontend will be available at http://localhost:5173
```

## Default Credentials

Use these credentials to test the application:

**Admin Account**
- Email: admin@admin.com
- Password: admin
- Role: ADMIN

**Distributor Account**
- Email: dist@dist.com
- Password: admin
- Role: DISTRIBUTOR

**Retailer Account**
- Email: retailer@ret.com
- Password: admin
- Role: RETAILER

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get users (hierarchy-aware)
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `GET /api/users/:id/children` - Get user's child users

### QR Codes
- `POST /api/qrs/generate` - Generate QR codes (admin only)
- `GET /api/qrs` - Get QR codes with filters
- `GET /api/qrs/code/:code` - Get QR by code
- `POST /api/qrs/:id/activate` - Activate QR code
- `PUT /api/qrs/:id/owner` - Update owner details

### Transactions
- `POST /api/transactions/request` - Request credits
- `GET /api/transactions/pending` - Get pending requests
- `GET /api/transactions/my` - Get user's transactions
- `POST /api/transactions/:id/approve` - Approve transaction
- `POST /api/transactions/:id/reject` - Reject transaction

### Notifications
- `GET /api/notifications` - Get user's notifications
- `POST /api/notifications` - Create notification (admin only)
- `DELETE /api/notifications/:id` - Delete notification (admin only)

### Roles & Permissions
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create custom role (admin only)
- `PUT /api/roles/:id` - Update role (admin only)
- `DELETE /api/roles/:id` - Delete role (admin only)
- `POST /api/roles/check-permission` - Check if user has permission

### Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update settings (admin only)
- `GET /api/settings/sms-templates` - Get SMS templates
- `POST /api/settings/sms-templates` - Create SMS template (admin only)
- `DELETE /api/settings/sms-templates/:id` - Delete SMS template (admin only)

### Subscription Plans
- `GET /api/subscriptions` - Get all subscription plans
- `GET /api/subscriptions/:id` - Get specific plan
- `POST /api/subscriptions` - Create subscription plan (admin only)
- `PUT /api/subscriptions/:id` - Update subscription plan (admin only)
- `DELETE /api/subscriptions/:id` - Delete subscription plan (admin only)

## Key Features

### 1. Multi-Tier User Hierarchy
- **Admin**: Full system access, manages distributors
- **Distributor**: Manages retailers and sells credits
- **Retailer**: Activates QR codes and manages customers

### 2. QR Code Management
- Generate unique QR codes with serial numbers
- Two subscription types: Free (direct call) and Paid Masked (privacy)
- Track activation by retailer and transaction details

### 3. Credit & Transaction System
- Hierarchical credit requests (Retailer → Distributor → Admin)
- Manual transaction verification with UPI reference tracking
- Complete credit history and audit logs

### 4. Role-Based Access Control (RBAC)
- System roles (Super Admin, Distributor, Retailer) that cannot be deleted
- Custom roles with granular permissions (view, create, edit, delete)
- Per-resource permission checking

### 5. Notification System
- Admin broadcasts notifications to all users or specific roles
- Real-time notification delivery based on user roles
- Notification management (create, delete)

### 6. System Settings
- SMS API key management
- Masked call service configuration
- Admin payment information and UPI QR storage
- Support contact details and logo management

## Common Tasks

### Generate QR Codes

1. Log in as Admin
2. Go to QR Management
3. Click "Generate QRs"
4. Enter quantity (e.g., 100)
5. QRs will be created in UNUSED status

### Activate QR Code (Retailer)

1. Log in as Retailer
2. Go to QR Management
3. Select an UNUSED QR code
4. Fill in vehicle owner details:
   - Owner Name
   - Mobile Number
   - Address
   - Vehicle Number
5. Select subscription plan (Free or Paid)
6. Click "Activate"
7. System deducts 1 credit from retailer's available credits

### Request Credits (Retailer)

1. Log in as Retailer
2. Go to Dashboard/Financials
3. Click "Request Credits"
4. Enter amount needed
5. Enter UPI transaction reference ID
6. Submit request
7. Distributor will receive pending approval

### Approve Credit Request (Distributor/Admin)

1. Log in as Distributor or Admin
2. Go to Dashboard
3. View "Pending Credit Requests"
4. Verify payment in bank/UPI
5. Click "Approve" to transfer credits
6. Credits are deducted from seller and added to buyer

### Create Custom Role (Admin)

1. Log in as Admin
2. Go to Role Management
3. Click "Create Role"
4. Enter role name and description
5. Select permissions for each resource
6. Click "Create"

### Broadcast Notification (Admin)

1. Log in as Admin
2. Go to Notification Center
3. Click "Send New Alert"
4. Select target audience (All, Distributors, or Retailers)
5. Enter title and message
6. Click "Broadcast Notification"

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution:
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env is correct
- Verify database exists: createdb parking_spot
```

### Port Already in Use
```
Solution:
- Backend (5000): kill -9 $(lsof -t -i :5000)
- Frontend (5173): kill -9 $(lsof -t -i :5173)
```

### Migration Errors
```
npm run prisma:migrate -- --name init
npm run prisma:generate
npm run dev
```

### CORS Errors
- Make sure FRONTEND_URL in backend .env matches your frontend URL
- Default: http://localhost:5173

## Deployment

### Build Frontend
```bash
npm run build
# Creates dist/ folder with optimized production build
```

### Build Backend
```bash
cd backend
npm run build
# Creates dist/ folder with compiled JavaScript
npm run start
# Starts the production server
```

### Environment Variables for Production
Update `.env` in backend:
```
DATABASE_URL="postgresql://user:password@production-db-host:5432/parking_spot"
JWT_SECRET="use-a-strong-random-string"
NODE_ENV="production"
PORT=5000
FRONTEND_URL="https://your-domain.com"
```

## Security Considerations

1. **JWT Secret**: Change `JWT_SECRET` in production
2. **Password Hashing**: All passwords are hashed with bcrypt
3. **CORS**: Configured to only allow requests from specified FRONTEND_URL
4. **Authentication**: All protected routes require valid JWT token
5. **Role-Based Access**: API validates permissions server-side
6. **Database**: Use strong credentials and enable SSL in production

## Support & Development

- All API requests require JWT authentication (except login/register)
- Token should be sent in header: `Authorization: Bearer <token>`
- Responses follow standard format: `{ success: boolean, data?: any, error?: string }`
- All dates stored in ISO 8601 format in database

## Next Steps

1. Run the setup (see Setup Instructions above)
2. Open two terminals: one for backend, one for frontend
3. Test with default credentials
4. Explore API endpoints using the frontend UI or tools like Postman
5. Customize SMS templates, payment details, and support info in settings
6. Create custom roles and notification templates
7. Deploy to your hosting provider

