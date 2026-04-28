#!/bin/bash
# Fresh Grocery - Automated Setup Script
# This script automates the setup process

echo "🚀 Fresh Grocery Setup Script"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js first.${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL not found. Please install MySQL first.${NC}"
    echo "Visit: https://dev.mysql.com/downloads/mysql/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and MySQL found${NC}"
echo ""

# Navigate to backend
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

# Install dependencies
echo "Installing npm packages..."
npm install

# Create .env file if not exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your database credentials${NC}"
fi

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Go back to root
cd ..

# Database setup instructions
echo -e "${BLUE}Setting up database...${NC}"
echo -e "${YELLOW}Please run these MySQL commands:${NC}"
echo "  mysql -u root -p"
echo "  CREATE DATABASE grocery_delivery_db;"
echo "  USE grocery_delivery_db;"
echo "  SOURCE database/schema.sql;"
echo "  exit;"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit backend/.env with your database credentials"
echo "2. Set up the database using MySQL commands above"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Open frontend/index.html in your browser"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
