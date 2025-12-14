<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Parking Spot Application

This is a QR code management system for parking spot management with a hierarchical user structure.

## Run Locally (Development)

**Prerequisites:** Node.js, PostgreSQL

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```
2. Set up the database:
   ```bash
   # Start PostgreSQL (using Docker)
   docker-compose up -d postgres
   
   # Or use your local PostgreSQL installation
   ```
3. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env` and update values
   - Update `.env.local` with your configuration
4. Run database migrations:
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   ```
5. Start the backend:
   ```bash
   npm run dev
   ```
6. Start the frontend (in another terminal):
   ```bash
   cd ..  # Back to root directory
   npm run dev
   ```

## Deploy to Production

**Prerequisites:** Docker, Docker Compose

1. Update environment variables in:
   - `backend/.env.production` (especially JWT_SECRET)
   - `.env.production` (frontend)

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

3. Or deploy manually:
   ```bash
   # Build the frontend
   npm run build
   
   # Start all services
   docker-compose up -d
   ```

## Access the Application

- **Development**: http://localhost:5173
- **Production**: https://qr.mytesting.cloud

## Default Credentials

- Admin: admin@admin.com / admin
- Distributor: dist@dist.com / admin
- Retailer: retailer@ret.com / admin