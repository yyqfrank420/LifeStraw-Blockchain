#!/bin/bash

echo "=========================================="
echo "🚀 DEMO DAY STARTUP"
echo "=========================================="
echo ""

# Set fixed API key to avoid mismatch between backend and frontend
API_KEY="demo-key-fb798dd0c0d5869d1526e360413f84906928dfcaba790c2ac6d49a7122a2e08c"

# Cleanup function for error handling
cleanup_on_error() {
    echo ""
    echo "❌ Startup failed. Cleaning up..."
    pkill -f "node server.js" > /dev/null 2>&1
    pkill -f "vite" > /dev/null 2>&1
    pkill -f ngrok > /dev/null 2>&1
    exit 1
}

# Check prerequisites
echo "0️⃣  Checking prerequisites..."

# Check if ports are available
for port in 3000 5173 4040; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "   ⚠️  Port $port is already in use. Killing existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
done

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "   ⚠️  ngrok not found. Install it or skip ngrok setup."
    echo "   Visit: https://ngrok.com/download"
    SKIP_NGROK=true
else
    SKIP_NGROK=false
fi

echo "   ✅ Prerequisites checked"

# 1. Start Docker
echo ""
echo "1️⃣  Starting Docker Desktop..."
open -a Docker
echo "   ⏳ Waiting for Docker to start (checking every 3 seconds)..."

# Wait for Docker to be ready
MAX_WAIT=90
COUNTER=0
while ! docker info > /dev/null 2>&1; do
    sleep 3
    COUNTER=$((COUNTER + 3))
    if [ $COUNTER -ge $MAX_WAIT ]; then
        echo "   ⚠️  Docker didn't start in time. Please start Docker Desktop manually."
        echo "   After Docker is running, press ENTER to continue..."
        read
        if ! docker info > /dev/null 2>&1; then
            echo "   ❌ Docker still not running. Exiting."
            exit 1
        fi
        break
    fi
done

if docker info > /dev/null 2>&1; then
    echo "   ✅ Docker is running"
fi

# 2. Start Fabric
echo ""
echo "2️⃣  Starting Fabric network..."
cd /Users/yangyuqing/Desktop/blockchain/fabric-samples/test-network

# Clean up any existing network
echo "   🧹 Cleaning up old network..."
./network.sh down > /dev/null 2>&1

# Check chaincode dependencies
echo "   📦 Checking chaincode dependencies..."
if [ ! -d "../../chaincode/lifestraw/node_modules" ]; then
    echo "   📦 Installing chaincode dependencies..."
    cd ../../chaincode/lifestraw
    npm install || { echo "   ❌ Failed to install chaincode dependencies"; cleanup_on_error; }
    cd ../../fabric-samples/test-network
fi

# Start fresh network
echo "   🚀 Starting network (this may take 30-60 seconds)..."
if ! ./network.sh up createChannel -c ch1 -ca -s couchdb; then
    echo "   ❌ Failed to start Fabric network"
    cleanup_on_error
fi

echo "   📦 Deploying chaincode..."
if ! ./network.sh deployCC -c ch1 -ccn lifestraw -ccp ../../chaincode/lifestraw -ccl javascript; then
    echo "   ❌ Failed to deploy chaincode"
    cleanup_on_error
fi

echo "   ✅ Fabric network running"

# 3. Copy fresh connection profile
echo ""
echo "3️⃣  Updating connection profile and wallet..."
cd /Users/yangyuqing/Desktop/blockchain

# Copy fresh connection profile (certificates change on each network restart)
if [ -f "fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json" ]; then
    cp fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json \
       server/fabric/connection-org1.json
    echo "   ✅ Connection profile updated"
else
    echo "   ❌ Connection profile not found"
    cleanup_on_error
fi

# 4. Enroll wallet with Admin credentials (has proper permissions for discovery)
echo "   🔐 Enrolling wallet with Admin credentials..."
cd server
node -e "
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        const wallet = await Wallets.newFileSystemWallet('./fabric/wallet');
        const credPath = '../fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com';
        
        // Verify credentials exist
        if (!fs.existsSync(path.join(credPath, 'msp/signcerts/cert.pem'))) {
            throw new Error('Admin credentials not found');
        }
        
        const cert = fs.readFileSync(path.join(credPath, 'msp/signcerts/cert.pem')).toString();
        const keyFiles = fs.readdirSync(path.join(credPath, 'msp/keystore'));
        if (keyFiles.length === 0) {
            throw new Error('No key file found in Admin keystore');
        }
        const keyFile = keyFiles[0];
        const key = fs.readFileSync(path.join(credPath, 'msp/keystore', keyFile)).toString();
        
        await wallet.put('appUser', {
            credentials: { certificate: cert, privateKey: key },
            mspId: 'Org1MSP',
            type: 'X.509'
        });
        console.log('   ✅ Wallet enrolled successfully with Admin credentials');
    } catch (err) {
        console.error('   ❌ Wallet enrollment failed:', err.message);
        process.exit(1);
    }
})();
" || { echo "   ❌ Wallet enrollment failed"; cleanup_on_error; }

# 5. Set fixed API key for backend
echo ""
echo "4️⃣  Configuring API keys..."
cd /Users/yangyuqing/Desktop/blockchain/server
echo "API_KEY=$API_KEY" > .env
echo "   ✅ Backend API key configured"

# 6. Set matching API key for frontend
cd /Users/yangyuqing/Desktop/blockchain/client
echo "VITE_API_KEY=$API_KEY" > .env.local
echo "   ✅ Frontend API key configured (matches backend)"

# 7. Kill any existing processes
echo ""
echo "5️⃣  Cleaning up existing processes..."
pkill -f "node server.js" > /dev/null 2>&1
pkill -f "vite" > /dev/null 2>&1
pkill -f ngrok > /dev/null 2>&1
sleep 2
echo "   ✅ Cleanup complete"

# 8. Start Backend with retry logic
echo ""
echo "6️⃣  Starting backend..."
cd /Users/yangyuqing/Desktop/blockchain/server

# Start backend
nohup node server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend with retry
echo "   ⏳ Waiting for backend to initialize (may take 10-15 seconds)..."
MAX_RETRIES=20
RETRY_COUNT=0
BACKEND_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        BACKEND_READY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   ⏳ Still initializing... ($RETRY_COUNT/$MAX_RETRIES)"
done

if [ "$BACKEND_READY" = true ]; then
    echo "   ✅ Backend running on port 3000 (PID: $BACKEND_PID)"
else
    echo "   ❌ Backend failed to start after $MAX_RETRIES attempts"
    echo "   📋 Last 30 lines of backend log:"
    tail -30 /tmp/backend.log
    cleanup_on_error
fi

# 9. Start Frontend
echo ""
echo "7️⃣  Starting frontend..."
cd /Users/yangyuqing/Desktop/blockchain/client

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "   📦 Installing frontend dependencies..."
    npm install || { echo "   ❌ Failed to install frontend dependencies"; cleanup_on_error; }
fi

nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
echo "   ⏳ Waiting for frontend to start (may take 5-10 seconds)..."
MAX_RETRIES=15
RETRY_COUNT=0
FRONTEND_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        FRONTEND_READY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$FRONTEND_READY" = true ]; then
    echo "   ✅ Frontend running on port 5173 (PID: $FRONTEND_PID)"
else
    echo "   ❌ Frontend failed to start"
    echo "   📋 Last 20 lines of frontend log:"
    tail -20 /tmp/frontend.log
    cleanup_on_error
fi

# 10. Start ngrok for frontend (free tier allows one tunnel)
echo ""
if [ "$SKIP_NGROK" = true ]; then
    echo "8️⃣  Skipping ngrok (not installed)"
    FRONTEND_URL="http://localhost:5173"
else
    echo "8️⃣  Starting ngrok for frontend..."
    cd /Users/yangyuqing/Desktop/blockchain
    nohup ngrok http 5173 > /tmp/ngrok_frontend.log 2>&1 &
    NGROK_PID=$!
    
    # Wait for ngrok to start
    echo "   ⏳ Waiting for ngrok to initialize..."
    sleep 5
    
    # Get frontend URL with retry
    FRONTEND_URL=""
    for i in {1..5}; do
        FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)
        if [ -n "$FRONTEND_URL" ]; then
            break
        fi
        sleep 2
    done
    
    if [ -z "$FRONTEND_URL" ]; then
        echo "   ⚠️  Could not get ngrok URL"
        echo "   Check manually at: http://localhost:4040"
        FRONTEND_URL="http://localhost:5173 (ngrok failed - check http://localhost:4040)"
    fi
fi

echo ""
echo "=========================================="
echo "✅ ALL SERVICES RUNNING!"
echo "=========================================="
echo ""
echo "🌐 DEMO URL (share this with audience):"
echo "   $FRONTEND_URL"
echo ""
echo "💻 LOCAL ACCESS (for your laptop):"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   ngrok UI: http://localhost:4040 (to see requests)"
echo ""
echo "📊 COUCHDB (database inspection):"
echo "   http://localhost:5984/_utils"
echo "   Login: admin / adminpw"
echo "   Database: ch1_lifestraw"
echo ""
echo "🔑 API KEY (frontend ↔ backend):"
echo "   Already configured and matching"
echo "   Key: ${API_KEY:0:32}..."
echo ""
echo "🎯 READY FOR PRESENTATION!"
echo ""
echo "💡 PROCESS INFO:"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
if [ "$SKIP_NGROK" = false ]; then
    echo "   ngrok PID:    $NGROK_PID"
fi
echo ""
echo "💡 VIEW LOGS IN REAL-TIME:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "💡 TO STOP ALL SERVICES:"
echo "   pkill -f 'node server.js'"
echo "   pkill -f vite"
if [ "$SKIP_NGROK" = false ]; then
    echo "   pkill -f ngrok"
fi
echo "   cd fabric-samples/test-network && ./network.sh down"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "   • Services run in background (survive terminal close)"
echo "   • Ngrok URL changes on each restart (free tier)"
echo "   • Backend connects to Fabric on localhost"
echo "   • Frontend uses Vite proxy for API calls via ngrok"
echo ""
echo "📱 DEMO TIP:"
echo "   Open the ngrok URL on projector/phone for demo"
echo "   Keep localhost:5173 on your laptop for monitoring"
echo ""
