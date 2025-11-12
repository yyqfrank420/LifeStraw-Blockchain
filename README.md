# LDVB - LifeStraw Digital Verification Blockchain

A permissioned blockchain system that records and verifies the complete lifecycle of LifeStraw water filters, from manufacture to installation and replacement.

## Overview

LDVB is a Hyperledger Fabric-based traceability system that ensures each LifeStraw filter has a digital identity on a private blockchain. The system captures and verifies every event: manufactured → shipped → received → installed → replaced or lost.

### Key Features

- **Real-time Blockchain Recording**: All filter lifecycle events are recorded on Hyperledger Fabric
- **Mobile-First UI**: Responsive React frontend with professional LifeStraw branding
- **SQLite Cache**: Fast queries for recent events and statistics
- **CouchDB Visualization**: View complete ledger state via web UI
- **Role-Based Access**: Four distinct portals (HQ Operations, Local NGO Manager, Field Agent, Donor)
- **ngrok Support**: Easy remote access for demos and testing

## Architecture

```
React + Vite + Tailwind (Frontend)
        ↓ axios
Express + Fabric Gateway + SQLite (Backend)
        ↓
Hyperledger Fabric Test Network (Docker)
        ↓
CouchDB World State (http://localhost:5984/_utils)
```

## Prerequisites

- **Node.js** 18+ and npm
- **Docker Desktop** (running)
- **Git**
- **ngrok** (optional, for remote access)

## Quick Start

### 1. Clone and Setup

```bash
cd ~/Desktop/blockchain
```

### 2. Setup Fabric Network

```bash
# Run the automated setup script
./scripts/setup-fabric.sh
```

This script will:
- Clone fabric-samples (if needed)
- Download Fabric binaries (2.5.6, 1.5.8)
- Start the test network with channel `ch1` and CA
- Deploy the LifeStraw chaincode
- Copy connection profile to `server/fabric/connection-org1.json`

**Manual Alternative:**
```bash
mkdir ~/ldvb && cd ~/ldvb
git clone https://github.com/hyperledger/fabric-samples
cd fabric-samples
curl -sSL https://bit.ly/2ysbiFn | bash -s -- 2.5.6 1.5.8
cd test-network
./network.sh up createChannel -c ch1 -ca

# Copy chaincode
mkdir -p ../chaincode/lifestraw
cp -r /path/to/blockchain/chaincode/lifestraw/* ../chaincode/lifestraw/
cd ../chaincode/lifestraw
npm install

# Deploy chaincode
cd ../../test-network
./network.sh deployCC -c ch1 -ccn lifestraw -ccp ../chaincode/lifestraw -ccl javascript

# Copy connection profile
cp organizations/peerOrganizations/org1.example.com/connection-org1.json \
   /path/to/blockchain/server/fabric/
```

### 3. Setup Wallet (Enroll appUser)

**Option A: Using Node.js script (Recommended)**
```bash
cd server
npm install
node ../scripts/enroll-user.js
```

**Option B: Using shell script**
```bash
./scripts/setup-wallet.sh
```

### 4. Configure Environment

Copy example env files and update if needed:

```bash
# Server
cd server
cp .env.example .env
# Edit .env if needed (defaults should work)

# Client
cd ../client
cp .env.example .env
# Edit .env if using ngrok
```

### 5. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 6. Start Services

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **CouchDB UI**: http://localhost:5984/_utils
  - Login: `admin` / `adminpw`
  - Database: `ch1_lifestraw` (appears after first transaction)
  - Note: CouchDB is the state database (query layer). The blockchain ledger (blocks) is the immutable source of truth.

### Role Portals

1. **HQ Operations** (`/hq-ops`)
   - Register new batches
   - Ship batches to destinations
   - Track and search units by ID, batch, site, or warehouse
   - View complete unit history
   - Export JSON proofs

2. **Local NGO Manager** (`/ngo-manager`)
   - Receive batches at warehouse (SHIPPED → RECEIVED)
   - Flag lost/damaged units
   - Manage warehouse operations

3. **Field Agent** (`/field-agent`)
   - Verify filters at sites (RECEIVED → INSTALLED)
   - Replace old units
   - Flag lost/damaged units

4. **Donor** (`/donor`)
   - View verified delivery metrics
   - See replacement compliance rates
   - Monitor impact statistics

### API Endpoints

All write operations require `X-API-Key` header (default: `dev-api-key-change-in-production`)

**Write Operations:**
- `POST /api/register` - Register new batch
- `POST /api/ship` - Ship batch
- `POST /api/receive` - Receive at warehouse
- `POST /api/install` - Receive & verify at site
- `POST /api/replace` - Replace unit
- `POST /api/flag` - Flag lost/damaged

**Read Operations:**
- `GET /api/read/:unitId` - Query unit history
- `GET /api/recent?limit=25` - Recent events from cache
- `GET /api/stats` - Aggregate statistics
- `GET /api/search?q=query` - Search units

### Example API Calls

```bash
# Register a batch
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key-change-in-production" \
  -d '{
    "batchId": "BATCH-2024-001",
    "unitIds": ["unit001", "unit002", "unit003"]
  }'

# Receive & verify a unit at site
curl -X POST http://localhost:3000/api/install \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key-change-in-production" \
  -d '{
    "unitId": "unit001",
    "siteId": "SITE-001",
    "installerId": "agent-john"
  }'

# Query unit history
curl http://localhost:3000/api/read/unit001
```

## Remote Access with ngrok

To share your demo with remote teammates:

1. **Install ngrok**: https://ngrok.com/download

2. **Start ngrok tunnel:**
```bash
ngrok http 3000
```

3. **Update client .env:**
```bash
# client/.env
VITE_API_BASE=https://your-ngrok-url.ngrok.io
```

4. **Restart frontend** to pick up new API URL

5. **Update server CORS** (if needed):
```bash
# server/.env
CORS_ORIGIN=http://localhost:5173,https://your-ngrok-url.ngrok.io
```

## CouchDB Visualization

Access the CouchDB web UI to view the complete ledger state:

1. Open http://localhost:5984/_utils
2. Select database: `ch1_lifestraw`
3. Browse documents to see filter states
4. Use the query interface for advanced searches

Each document represents a filter unit with its complete history.

## Chaincode Operations

The LifeStraw chaincode implements 7 operations:

1. **RegisterBatch** - Create new filter units in a batch
2. **ShipBatch** - Mark batch as shipped to destination
3. **ReceiveAtWarehouse** - Record warehouse receipt
4. **InstallAtSite** - Record receipt and verification at a site
5. **ReplaceUnit** - Handle replacement of old unit with new
6. **FlagLostDamaged** - Mark unit as lost or damaged
7. **ReadUnit** - Query unit history and current state

### State Transitions

```
REGISTERED → SHIPPED → RECEIVED → INSTALLED → REPLACED/LOST_OR_DAMAGED
```

## Design System

### Color Palette
- **Primary**: #007CC3 (LifeStraw Blue)
- **Hover**: #0066A3
- **Background**: White (#FFFFFF) with gray-50 (#F9FAFB) accents
- **Text**: Gray scale (gray-600 to gray-900)

### Typography
- **Headings**: Bold, large sizes (text-3xl to text-6xl)
- **Body**: Regular weight, 16px base
- **Labels**: Semibold, 14px

### Components
- **Cards**: White background, subtle borders, rounded-xl
- **Buttons**: LifeStraw blue primary, proper hover states
- **Icons**: Lucide React (professional SVG icons)
- **Spacing**: Consistent Tailwind scale (4px increments)

## Troubleshooting

### Fabric Network Issues

**Problem**: Docker containers not starting
```bash
# Check Docker is running
docker ps

# Clean up and restart
cd fabric-samples/test-network
./network.sh down
docker volume prune -f
./network.sh up createChannel -c ch1 -ca
```

**Problem**: Chaincode deployment fails
```bash
# Check chaincode directory exists
ls fabric-samples/chaincode/lifestraw/

# Reinstall dependencies
cd fabric-samples/chaincode/lifestraw
npm install

# Redeploy
cd ../../test-network
./network.sh deployCC -c ch1 -ccn lifestraw -ccp ../chaincode/lifestraw -ccl javascript
```

### Wallet Enrollment Issues

**Problem**: "User not found in wallet"
```bash
# Use Node.js enrollment script
cd server
node ../scripts/enroll-user.js

# Or manually enroll via Fabric CA CLI
# (see setup-wallet.sh for commands)
```

**Problem**: Connection profile not found
```bash
# Copy from fabric-samples
cp fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json \
   server/fabric/connection-org1.json
```

### Backend Issues

**Problem**: "Gateway not initialized"
- Ensure Fabric network is running: `docker ps`
- Check connection profile exists: `server/fabric/connection-org1.json`
- Verify wallet has appUser: `ls server/fabric/wallet/appUser/`

**Problem**: Port 3000 already in use
```bash
# Change port in server/.env
PORT=3001
```

### Frontend Issues

**Problem**: API calls failing
- Check backend is running on correct port
- Verify `VITE_API_BASE` in `client/.env` matches backend URL
- Check browser console for CORS errors
- Ensure API key matches: `VITE_API_KEY` in client matches `API_KEY` in server

**Problem**: Tailwind styles not applying
```bash
cd client
npm install
# Restart dev server
```

## Project Structure

```
blockchain/
├── chaincode/
│   └── lifestraw/
│       ├── index.js          # Chaincode implementation
│       └── package.json
├── server/
│   ├── server.js             # Express app
│   ├── fabric/
│   │   ├── gateway.js        # Fabric Gateway wrapper
│   │   ├── connection-org1.json
│   │   └── wallet/           # Fabric identities
│   ├── db/
│   │   └── database.js       # SQLite operations
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # Reusable components
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── scripts/
│   ├── setup-fabric.sh       # Fabric network setup
│   ├── setup-wallet.sh       # Wallet enrollment (shell)
│   └── enroll-user.js        # Wallet enrollment (Node.js)
└── README.md
```

## Code Quality & Audit

### Quality Score: 7/10

| Category | Score | Status |
|----------|-------|--------|
| **Functionality** | 9/10 | ✅ All features working |
| **Code Quality** | 8/10 | ✅ Clean, maintainable |
| **Performance** | 7/10 | ⚠️ Polling could be optimized |
| **Security** | 7/10 | ⚠️ Basic security, needs hardening |
| **Design/UX** | 8/10 | ✅ Professional LifeStraw branding |
| **Accessibility** | 6/10 | ⚠️ Basic structure, needs ARIA |
| **Mobile** | 8/10 | ✅ Responsive design |
| **Documentation** | 9/10 | ✅ Comprehensive |

### Known Issues Fixed

1. ✅ Transaction ID retrieval bug (critical)
2. ✅ Comma-separated unitIds transformation
3. ✅ Cache field preservation
4. ✅ ReplaceUnit validation
5. ✅ Stats return type (number vs string)
6. ✅ Unnecessary async/await removed
7. ✅ Emojis replaced with professional icons
8. ✅ Color palette simplified to LifeStraw brand
9. ✅ Typography hierarchy improved
10. ✅ Consistent spacing system
11. ✅ Card designs polished
12. ✅ Table styling enhanced
13. ✅ Form UX improved

### Remaining Enhancements (Future)

- Skeleton loading screens
- Mobile-optimized table views
- Breadcrumb navigation
- Enhanced error messages (user-friendly)
- Empty state illustrations
- Full accessibility audit (ARIA labels, keyboard nav)
- WebSockets instead of polling
- Favicon and meta tags

## Acceptance Tests

Run these tests to verify the system:

1. **Register Batch**
   ```bash
   curl -X POST http://localhost:3000/api/register \
     -H "Content-Type: application/json" \
     -H "X-API-Key: dev-api-key-change-in-production" \
     -d '{"batchId":"TEST-001","unitIds":["test001"]}'
   ```
   - Expected: Returns 200 with txId
   - Verify: CouchDB shows unit with state "REGISTERED"

2. **Install Unit**
   ```bash
   curl -X POST http://localhost:3000/api/install \
     -H "Content-Type: application/json" \
     -H "X-API-Key: dev-api-key-change-in-production" \
     -d '{"unitId":"test001","siteId":"SITE-001","installerId":"INST-001"}'
   ```
   - Expected: Returns 200 with txId
   - Verify: CouchDB shows state "INSTALLED" within 2 seconds

3. **Query Unit**
   ```bash
   curl http://localhost:3000/api/read/test001
   ```
   - Expected: Returns JSON with history array including recent events

4. **Get Stats**
   ```bash
   curl http://localhost:3000/api/stats
   ```
   - Expected: Returns counts matching CouchDB total docs

5. **Frontend Flow**
   - Open http://localhost:5173
   - Select "Field Agent"
   - Submit an installation
   - Verify transaction appears in Recent Transactions within 2 seconds

## Security Notes

- **API Key**: Change default API key in production
- **CORS**: Update allowed origins in `server/.env`
- **Wallet**: Keep `server/fabric/wallet/` secure (already in .gitignore)
- **Connection Profile**: Contains TLS certs (already in .gitignore)

## Development

### Adding New Chaincode Functions

1. Add function to `chaincode/lifestraw/index.js`
2. Add API endpoint to `server/server.js`
3. Update cache logic in `server/server.js` (updateCache function)
4. Add UI component/page if needed

### Database Schema

**events table:**
- txId (PRIMARY KEY)
- unitId
- eventType
- ts (timestamp)
- org
- status
- metadata (JSON)

**units table:**
- unitId (PRIMARY KEY)
- state
- batchId
- siteId
- warehouseId
- installerId
- lastTs
- lastEventType

## License

This is a prototype/demo project. Adapt as needed for production use.

## Support

For issues:
1. Check Troubleshooting section above
2. Verify all prerequisites are installed
3. Check Docker containers are running: `docker ps`
4. Review server logs for detailed error messages

