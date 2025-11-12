# 🚀 Tomorrow's Demo - Simple Steps

## ⚠️ Important: ngrok Requires Localhost Running

**Yes, ngrok only works when your localhost services are running.** It's a tunnel that forwards internet traffic to your local machine.

**What this means:**
- ✅ Your laptop must be running (backend + frontend)
- ✅ You must keep the terminal open during demo
- ✅ If your laptop sleeps/disconnects, the ngrok link breaks
- ✅ The ngrok URL only works while services are running

---

## 📋 Tomorrow Morning (15 minutes before demo)

### Step 1: Run One Script

```bash
cd /Users/yangyuqing/Desktop/blockchain
chmod +x DEMO_DAY_COMMANDS.sh
./DEMO_DAY_COMMANDS.sh
```

**This script will:**
1. Start Docker Desktop
2. Start Fabric blockchain network
3. Start backend server (localhost:3000)
4. Start frontend dev server (localhost:5173)
5. Start ngrok tunnel for backend → get URL
6. Update frontend .env with backend ngrok URL
7. Start ngrok tunnel for frontend → get URL
8. Show you the **DEMO URL** to use on projector

### Step 2: Copy the Demo URL

At the end, you'll see:
```
🌐 DEMO URL (for projector):
   https://xxxx.ngrok-free.app
```

**Copy this URL** - this is what you open on the projector/other device.

---

## 🎯 During Demo

### On Your Laptop:
- Keep terminal open (don't close it!)
- Keep laptop plugged in (don't let it sleep)
- Keep WiFi connected (eduroam or hotspot)

### On Projector/Other Device:
- Open the ngrok URL in browser
- It will work as long as your laptop is running

---

## ⚠️ If Something Breaks

### ngrok link stops working?
1. Check terminal - are services still running?
2. Check laptop - did it sleep/disconnect WiFi?
3. Restart: `./DEMO_DAY_COMMANDS.sh` (will kill old processes first)

### Backend not responding?
```bash
# Check if backend is running
curl http://localhost:3000/api/stats

# If not, restart backend:
cd /Users/yangyuqing/Desktop/blockchain/server
node server.js &
```

### Frontend not loading?
- Refresh browser on projector
- Check frontend is running: `lsof -ti:5173`
- If not: `cd client && npm run dev &`

---

## 🔄 Alternative: Use Your Laptop Screen

**If ngrok is unreliable**, just:
1. Run `./DEMO_DAY_COMMANDS.sh` (starts everything)
2. Open `http://localhost:5173` on YOUR laptop
3. Connect laptop to projector via HDMI/USB-C
4. Present from your laptop screen

**This is more reliable** - no internet dependency!

---

## 📝 Quick Reference

**One command to start everything:**
```bash
./DEMO_DAY_COMMANDS.sh
```

**One command to stop everything:**
```bash
pkill -f 'node server.js'
pkill -f 'vite'
pkill -f ngrok
cd fabric-samples/test-network && ./network.sh down
```

**Check if everything is running:**
```bash
docker ps | grep peer          # Should see 8 containers
lsof -ti:3000                  # Should show backend PID
lsof -ti:5173                  # Should show frontend PID
curl http://localhost:3000/api/stats  # Should return JSON
```

---

## 💡 Pro Tips

1. **Test tonight** - Run `./DEMO_DAY_COMMANDS.sh` to make sure it works
2. **Keep laptop plugged in** - Don't let battery die
3. **Disable sleep** - System Preferences → Energy Saver → Prevent sleep
4. **Have backup plan** - Use laptop screen if ngrok fails
5. **Keep terminal visible** - So you can see if something crashes

---

**Remember:** ngrok = tunnel to your localhost. Your laptop must stay running!

