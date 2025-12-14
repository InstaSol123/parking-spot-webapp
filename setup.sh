#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Parking Spot - Quick Start Guide${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 16+ first.${NC}"
    exit 1
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL client is not found. Make sure PostgreSQL is installed.${NC}"
    echo "Using Docker PostgreSQL? Run: docker-compose up -d postgres"
    echo ""
fi

# Step 1: Setup Database
echo -e "${BLUE}Step 1: Setting up PostgreSQL database...${NC}"
if ! psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'parking_spot'" | grep -q 1; then
    echo "Creating parking_spot database..."
    createdb -U postgres parking_spot
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${GREEN}✓ Database already exists${NC}"
fi
echo ""

# Step 2: Backend Setup
echo -e "${BLUE}Step 2: Setting up Backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    sed -i 's|postgresql://user:password@localhost:5432/parking_spot|postgresql://postgres:postgres@localhost:5432/parking_spot|g' .env
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo "Running Prisma migrations..."
npm run prisma:generate
npm run prisma:migrate -- --name init || echo "Migrations completed or already applied"
echo -e "${GREEN}✓ Prisma setup complete${NC}"
echo ""

# Step 3: Frontend Setup
echo -e "${BLUE}Step 3: Setting up Frontend...${NC}"
cd ..
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    echo "VITE_API_URL=http://localhost:5000" > .env.local
    echo -e "${GREEN}✓ .env.local file created${NC}"
else
    echo -e "${GREEN}✓ .env.local file already exists${NC}"
fi
echo ""

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Open a new terminal window and run:"
echo -e "   ${BLUE}cd backend && npm run dev${NC}"
echo ""
echo "2. Open another terminal window and run:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "3. Open your browser and go to:"
echo -e "   ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo -e "  Admin:       admin@admin.com / admin"
echo -e "  Distributor: dist@dist.com / admin"
echo -e "  Retailer:    retailer@ret.com / admin"
echo ""
echo -e "${YELLOW}For more info, see: BACKEND_SETUP.md${NC}"
