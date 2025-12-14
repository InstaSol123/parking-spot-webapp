#!/bin/bash

# Test script to verify API endpoints

echo "Testing API endpoints..."

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:5000/health | jq .

# Test settings endpoint (requires authentication)
echo "2. Testing settings endpoint (this will fail without auth)..."
curl -s http://localhost:5000/api/settings | jq .

# Test login endpoint
echo "3. Testing login endpoint..."
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin"}' | jq .

echo "API tests completed."