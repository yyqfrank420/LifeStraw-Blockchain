# LifeStraw Digital Verification Blockchain

A permissioned blockchain system that records and verifies the complete lifecycle of LifeStraw water filters, from manufacture to delivery verification and replacement.

**🔗 GitHub Repository**: https://github.com/yyqfrank420/LifeStraw-Blockchain

## Overview

LDVB is a Hyperledger Fabric-based traceability system that ensures each LifeStraw filter has a digital identity on a private blockchain. The system captures and verifies every event: **manufactured → shipped → received → verified → replaced or lost**.

### Key Features

- **Real-time Blockchain Recording**: All filter lifecycle events are recorded immutably on Hyperledger Fabric
- **Mobile-First UI**: Responsive React frontend with professional LifeStraw branding
- **SQLite Cache**: Fast queries for recent events and statistics
- **CouchDB Visualization**: View complete ledger state via web UI
- **Role-Based Access**: Four distinct portals (HQ Operations, Local NGO Manager, Field Agent, Donor)
- **ngrok Support**: Easy remote access for demos and presentations

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

**Important**: The blockchain ledger (blocks) is the **immutable source of truth**. CouchDB is a query layer derived from the blockchain.

## Prerequisites

- **Node.js** 18+ and npm
- **Docker Desktop** (running)
- **Git**
- **ngrok** (optional, for remote access/demos)

## Quick Start (Demo Day)

For a complete demo setup, use the automated script:

```bash
cd /Users/yangyuqing/Desktop/blockchain
bash DEMO_DAY_COMMANDS.sh
```

This script will:
1. ✅ Start Docker Desktop (waits for you to confirm)
2. ✅ Start Fabric network with CouchDB
3. ✅ Deploy LifeStraw chaincode
4. ✅ Start backend server (port 3000)
5. ✅ Start frontend dev server (port 5173)
6. ✅ Start ngrok tunnels for both
7. ✅ Display demo URLs

**For detailed demo instructions**, see `DEMO_GUIDE.md` and `Demo Ops Guide.md`.

## Manual Setup

### 1. Setup Fabric Network

```bash
# Run the automated setup script
./scripts/setup-fabric.sh
```

This script will:
- Clone fabric-samples (if needed)
- Download Fabric binaries
- Start the test network with channel `ch1` and CA
- Deploy the LifeStraw chaincode
- Copy connection profile to `server/fabric/connection-org1.json`

### 2. Setup Wallet (Enroll appUser)

```bash
cd server
npm install
node ../scripts/quick-enroll.js
```

### 3. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd server
node server.js
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
   - Track and search units by ID or batch ID
   - View complete unit history
   - Export JSON proofs

2. **Local NGO Manager** (`/ngo-manager`)
   - Receive batches at warehouse (SHIPPED → RECEIVED)
   - Flag lost/damaged units
   - Manage warehouse operations

3. **Field Agent** (`/field-agent`)
   - Verify filters at sites (RECEIVED → VERIFIED)
   - Replace old units
   - Flag lost/damaged units

4. **Donor** (`/donor`)
   - View verified delivery metrics
   - See replacement compliance rates
   - Monitor impact statistics (lives saved)

### API Endpoints

All write operations require `X-API-Key` header (default: logged to console in dev mode)

**Write Operations:**
- `POST /api/register` - Register new batch
- `POST /api/ship` - Ship batch (requires batchId only, infers units)
- `POST /api/receive` - Receive at warehouse
- `POST /api/install` - Verify delivery at site (uses `verifierId`)
- `POST /api/replace` - Replace unit
- `POST /api/flag` - Flag lost/damaged

**Read Operations:**
- `GET /api/read/:unitId` - Query unit history
- `GET /api/recent?limit=25` - Recent events from cache
- `GET /api/stats` - Aggregate statistics
- `GET /api/search?q=query` - Search units by ID or batch ID
- `GET /api/blockchain/blocks` - Recent blockchain transactions
- `GET /api/blockchain/documents` - CouchDB state documents

### Example API Calls

```bash
# Register a batch (new naming: batch-yyyy-xxx)
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "batchId": "batch-2024-001",
    "unitIds": ["b-2024-u-001", "b-2024-u-002", "b-2024-u-003"]
  }'

# Ship batch (only needs batchId)
curl -X POST http://localhost:3000/api/ship \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "batchId": "batch-2024-001",
    "destination": "Nairobi Warehouse"
  }'

# Verify delivery at site (uses verifierId, not installerId)
curl -X POST http://localhost:3000/api/install \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "unitId": "b-2024-u-001",
    "siteId": "SITE-001",
    "verifierId": "agent-john"
  }'

# Query unit history
curl http://localhost:3000/api/read/b-2024-u-001
```

## Remote Access with ngrok

To share your demo with remote teammates or present on a projector:

1. **Install ngrok**: https://ngrok.com/download

2. **Start ngrok tunnels** (or use `DEMO_DAY_COMMANDS.sh` which does this automatically):
```bash
# Terminal 1: Backend tunnel
ngrok http 3000

# Terminal 2: Frontend tunnel  
ngrok http 5173
```

3. **Update client .env** (or let `DEMO_DAY_COMMANDS.sh` do it):
```bash
# client/.env
VITE_API_BASE=https://your-backend-ngrok-url.ngrok-free.app
```

4. **Access frontend** via ngrok URL on any device

**Note**: ngrok URLs change on restart. The demo script handles this automatically.

## Chaincode Operations

The LifeStraw chaincode implements 7 operations:

1. **RegisterBatch** - Create new filter units in a batch
2. **ShipBatch** - Mark batch as shipped to destination
3. **ReceiveAtWarehouse** - Record warehouse receipt
4. **VerifyAtSite** - Record delivery verification at a site (uses `verifierId`)
5. **ReplaceUnit** - Handle replacement of old unit with new
6. **FlagLostDamaged** - Mark unit as lost or damaged
7. **ReadUnit** - Query unit history and current state

### State Transitions

```
REGISTERED → SHIPPED → RECEIVED → VERIFIED → REPLACED/LOST_OR_DAMAGED
```

**Important Terminology**:
- ✅ **VERIFIED** (not "INSTALLED") - means delivery was verified at site
- ✅ **verifierId** (not "installerId") - the person who verified delivery
- ✅ We don't "install" filters, we **verify** they were delivered

### ID Format

- **Batch IDs**: `batch-yyyy-xxx` (e.g., `batch-2024-001`)
- **Unit IDs**: `b-yyyy-u-xxx` (e.g., `b-2024-u-001`)

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
│   │   ├── connection-org1.json.example
│   │   └── wallet/           # Fabric identities (gitignored)
│   ├── db/
│   │   └── database.js       # SQLite operations
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/            # React pages (Home, HQOps, etc.)
│   │   ├── components/       # Reusable components
│   │   ├── utils/            # Utilities (scan, etc.)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── scripts/
│   ├── setup-fabric.sh       # Fabric network setup
│   └── quick-enroll.js       # Wallet enrollment
├── DEMO_DAY_COMMANDS.sh      # One-command demo startup
├── DEMO_GUIDE.md             # Detailed demo instructions
├── Demo Ops Guide.md         # Demo operations guide
└── README.md
```

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
./network.sh up createChannel -c ch1 -ca -s couchdb
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
node ../scripts/quick-enroll.js
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
# Change port in server/.env or kill existing process
lsof -ti:3000 | xargs kill
```

### Frontend Issues

**Problem**: API calls failing
- Check backend is running on correct port
- Verify `VITE_API_BASE` in `client/.env` matches backend URL
- Check browser console for CORS errors
- Ensure API key matches (check backend console for dev API key)

**Problem**: ngrok "Blocked request" error
- Vite config includes `allowedHosts` for ngrok
- Ensure you're using the ngrok URL, not localhost
- Check `vite.config.js` has proxy configuration

## Security Notes

- **API Key**: Default API key is logged to console in dev mode. Change in production.
- **CORS**: Update allowed origins in `server/server.js` for production
- **Wallet**: Keep `server/fabric/wallet/` secure (already in .gitignore)
- **Connection Profile**: Contains TLS certs (example file only in repo)

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
- eventType (REGISTERED, SHIPPED, RECEIVED, VERIFIED, REPLACED, FLAGGED)
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
- verifierId (not installerId)
- lastTs
- lastEventType

## Recent Updates

- ✅ **Terminology Update**: Changed "INSTALLED" → "VERIFIED", "installerId" → "verifierId" across entire stack
- ✅ **ID Format**: New naming convention (`batch-yyyy-xxx`, `b-yyyy-u-xxx`)
- ✅ **Ship Batch**: Now only requires `batchId` (infers units from cache)
- ✅ **Bug Fixes**: All critical bugs fixed, full stack consistency verified
- ✅ **Mobile-First Design**: Complete UI redesign with LifeStraw branding
- ✅ **Blockchain Viewer**: In-app viewer with full-page mode
- ✅ **Demo Script**: One-command startup for demo day

## License

This is a prototype/demo project. Adapt as needed for production use.

## Support

For issues:
1. Check Troubleshooting section above
2. Verify all prerequisites are installed
3. Check Docker containers are running: `docker ps`
4. Review server logs for detailed error messages
5. See `DEMO_GUIDE.md` for detailed demo instructions
