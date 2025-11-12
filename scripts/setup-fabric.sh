#!/bin/bash

# LDVB Fabric Network Setup Script
# This script sets up the Hyperledger Fabric test network and deploys the LifeStraw chaincode

set -e

echo "=========================================="
echo "LDVB Fabric Network Setup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

# Determine project root (assuming script is in scripts/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FABRIC_SAMPLES_DIR="$PROJECT_ROOT/fabric-samples"

# Check if fabric-samples exists
if [ ! -d "$FABRIC_SAMPLES_DIR" ]; then
    echo -e "${YELLOW}fabric-samples not found. Cloning...${NC}"
    cd "$PROJECT_ROOT"
    git clone https://github.com/hyperledger/fabric-samples.git
fi

cd "$FABRIC_SAMPLES_DIR"

# Check if binaries are installed
if [ ! -f "bin/fabric-ca-client" ] || [ ! -f "bin/peer" ]; then
    echo -e "${YELLOW}Fabric binaries not found. Downloading...${NC}"
    curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary
fi

# Navigate to test-network
cd test-network

# Stop any existing network
echo -e "${YELLOW}Stopping any existing network...${NC}"
./network.sh down || true

# Start network with channel and CA
echo -e "${GREEN}Starting Fabric test network...${NC}"
./network.sh up createChannel -c ch1 -ca

# Copy chaincode to fabric-samples
echo -e "${GREEN}Copying chaincode...${NC}"
CHAINCODE_DIR="$PROJECT_ROOT/chaincode/lifestraw"
if [ -d "$CHAINCODE_DIR" ]; then
    mkdir -p "$FABRIC_SAMPLES_DIR/chaincode/lifestraw"
    cp -r "$CHAINCODE_DIR"/* "$FABRIC_SAMPLES_DIR/chaincode/lifestraw/"
else
    echo -e "${RED}Error: Chaincode directory not found at $CHAINCODE_DIR${NC}"
    exit 1
fi

# Install chaincode dependencies
echo -e "${GREEN}Installing chaincode dependencies...${NC}"
cd "$FABRIC_SAMPLES_DIR/chaincode/lifestraw"
npm install

# Deploy chaincode
echo -e "${GREEN}Deploying chaincode...${NC}"
cd "$FABRIC_SAMPLES_DIR/test-network"
./network.sh deployCC -c ch1 -ccn lifestraw -ccp ../chaincode/lifestraw -ccl javascript

# Copy connection profile
echo -e "${GREEN}Copying connection profile...${NC}"
CONNECTION_PROFILE="$FABRIC_SAMPLES_DIR/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json"
if [ -f "$CONNECTION_PROFILE" ]; then
    mkdir -p "$PROJECT_ROOT/server/fabric"
    cp "$CONNECTION_PROFILE" "$PROJECT_ROOT/server/fabric/connection-org1.json"
    echo -e "${GREEN}Connection profile copied to server/fabric/connection-org1.json${NC}"
else
    echo -e "${YELLOW}Warning: Connection profile not found. You may need to copy it manually.${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Fabric network setup complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Run ./scripts/setup-wallet.sh to enroll appUser"
echo "2. Start the backend server: cd server && npm install && npm start"
echo "3. Start the frontend: cd client && npm install && npm run dev"
echo ""
echo "CouchDB UI: http://localhost:5984/_utils"
echo "Database: ch1_lifestraw"

