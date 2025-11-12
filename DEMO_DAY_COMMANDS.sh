#!/bin/bash

echo "=========================================="
echo "🚀 DEMO DAY STARTUP"
echo "=========================================="
echo ""

# 1. Start Docker
echo "1️⃣  Starting Docker Desktop..."
open -a Docker
echo "   ⏳ Wait for Docker to start (check menu bar icon)"
read -p "   Press ENTER when Docker is running..."

# 2. Start Fabric
echo ""
echo "2️⃣  Starting Fabric network..."
cd /Users/yangyuqing/Desktop/blockchain/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -c ch1 -ca -s couchdb
./network.sh deployCC -c ch1 -ccn lifestraw -ccp ../../chaincode/lifestraw -ccl javascript
echo "   ✅ Fabric network running"

# 3. Start Backend
echo ""
echo "3️⃣  Starting backend..."
cd /Users/yangyuqing/Desktop/blockchain/server
nohup node server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3
echo "   ✅ Backend running on port 3000 (PID: $BACKEND_PID)"

# 4. Start Frontend
echo ""
echo "4️⃣  Starting frontend..."
cd /Users/yangyuqing/Desktop/blockchain/client
nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5
echo "   ✅ Frontend running on port 5173 (PID: $FRONTEND_PID)"

# 5. Start ngrok for backend
echo ""
echo "5️⃣  Starting ngrok for backend..."
cd /Users/yangyuqing/Desktop/blockchain
pkill -f ngrok
nohup ngrok http 3000 > /tmp/ngrok_backend.log 2>&1 &
NGROK_BACKEND_PID=$!
sleep 5

# Get backend URL
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)

if [ -z "$BACKEND_URL" ]; then
    echo "   ⚠️  Could not get backend URL, continuing anyway..."
else
    echo "   ✅ Backend URL: $BACKEND_URL"
    # Update frontend .env
    echo "VITE_API_BASE=$BACKEND_URL" > /Users/yangyuqing/Desktop/blockchain/client/.env
    echo "   ✅ Frontend configured"
fi

# 6. Start ngrok for frontend
echo ""
echo "6️⃣  Starting ngrok for frontend..."
nohup ngrok http 5173 > /tmp/ngrok_frontend.log 2>&1 &
NGROK_FRONTEND_PID=$!
sleep 5

# Get frontend URL
FRONTEND_URL=$(curl -s http://localhost:4041/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)
fi

echo ""
echo "=========================================="
echo "✅ ALL SERVICES RUNNING!"
echo "=========================================="
echo ""
echo "🌐 DEMO URL (for projector):"
echo "   $FRONTEND_URL"
echo ""
echo "🔧 BACKEND URL:"
echo "   $BACKEND_URL"
echo ""
echo "📊 COUCHDB (for your laptop):"
echo "   http://localhost:5984/_utils"
echo "   Login: admin / adminpw"
echo ""
echo "🎯 READY FOR PRESENTATION!"
echo ""
echo "💡 Process IDs (save these!):"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo "   ngrok Backend PID: $NGROK_BACKEND_PID"
echo "   ngrok Frontend PID: $NGROK_FRONTEND_PID"
echo ""
echo "💡 To stop all services:"
echo "   kill $BACKEND_PID $FRONTEND_PID $NGROK_BACKEND_PID $NGROK_FRONTEND_PID"
echo "   pkill -f ngrok"
echo "   cd /Users/yangyuqing/Desktop/blockchain/fabric-samples/test-network && ./network.sh down"
echo ""
echo "⚠️  Note: Processes will survive terminal closure (using nohup)"
echo "⚠️  But ngrok URLs will change if you restart!"
echo ""
