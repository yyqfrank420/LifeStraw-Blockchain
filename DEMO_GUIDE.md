# 🎯 LDVB Demo Presentation Guide

## 📋 Pre-Demo Checklist (Do This 10 Minutes Before)

### 0. Deploy for Remote Access (If Using Projector/Other Device)

**Quick Setup with ngrok:**

```bash
# Install ngrok (if not installed)
brew install ngrok
# Or download from: https://ngrok.com/download

# Sign up at https://dashboard.ngrok.com and get authtoken
ngrok config add-authtoken YOUR_TOKEN

# After starting backend (step 3), expose it:
ngrok http 3000
# Copy the URL (e.g., https://abc123.ngrok-free.app)

# Update frontend to use ngrok backend:
cd /Users/yangyuqing/Desktop/blockchain/client
echo "VITE_API_BASE=https://abc123.ngrok-free.app" > .env

# After starting frontend (step 4), expose it:
ngrok http 5173
# Copy this URL - THIS IS YOUR DEMO URL for projector
```

**Or use Vercel (Better, Permanent URL):**
Deploy frontend to Vercel, then expose backend via ngrok.

---

### 1. Start Docker Desktop
```bash
open -a Docker
# Wait until Docker icon in menu bar shows "running"
```

### 2. Start Fabric Network (if not running)
```bash
cd /Users/yangyuqing/Desktop/blockchain/fabric-samples/test-network
docker ps | grep peer  # Check if already running

# If no containers, start network WITH CouchDB:
./network.sh down  # Clean start
./network.sh up createChannel -c ch1 -ca -s couchdb
./network.sh deployCC -c ch1 -ccn lifestraw -ccp ../chaincode/lifestraw -ccl javascript
```

### 3. Start Backend Server
```bash
cd /Users/yangyuqing/Desktop/blockchain/server
node server.js

# You should see:
# ✓ Database initialized successfully
# ✓ Fabric Gateway initialized successfully
# ✓ Server running on http://localhost:3000
```

### 4. Start Frontend
```bash
# Open NEW terminal window
cd /Users/yangyuqing/Desktop/blockchain/client
npm run dev

# You should see:
# ✓ VITE ready
# ✓ Local: http://localhost:5173
```

### 5. Open CouchDB (for demo)
```bash
open http://localhost:5984/_utils
# Login: admin / adminpw
# Navigate to: ch1_lifestraw database → All Documents
# Keep this tab open - you'll refresh it during demo
```

**Note:** CouchDB is enabled by the `-s couchdb` flag when starting the network. It shows the blockchain state database (query layer). The blockchain ledger (blocks) is the immutable source of truth - CouchDB is derived from it.

### 6. Quick Health Check
```bash
# Test backend
curl http://localhost:3000/api/stats

# Test frontend
open http://localhost:5173
```

---

## 🎬 Demo Script (10-15 minutes)

### Opening (1 minute)

**What to do:**
- Open `http://localhost:5173` in browser
- Show the homepage

**What the screen shows:**
- LifeStraw logo with grid icon
- Mission statement: "Every filter gives one child safe water for a year..."
- "Lives Impacted This Year: 1" (or current count)
- 4 role cards: HQ Operations (first), Local NGO Manager, Field Agent, Donor
- "Powered by Hyperledger Fabric" footer

**What to say:**
> "I've built LDVB - a blockchain-based verification system for LifeStraw water filters. The problem: 30% of filter replacements go unreported, creating 2-3 week verification delays. My solution: immutable blockchain tracking from manufacture to installation, eliminating data gaps and delays."

**Key point:** Point to the mission statement and lives impacted counter.

---

### Act 1: Manufacturing & Distribution (4 minutes)

#### Step 1: HQ Operations - Register New Batch

**What to do:**
1. Click "HQ Operations" card (first card)
2. Click "Register New Batch" button
3. Fill in the form:
   ```
   Batch ID: DEMO-2024-001
   Unit IDs: filter-001, filter-002, filter-003
   ```
4. Click "Submit"
5. Wait for success message

**What the screen shows:**
- Success message appears with:
  - ✓ "Verified on Blockchain" badge
  - "Transaction successful! TX ID: [long hash]"
  - Transaction ID displayed prominently in monospace font
- Form closes automatically after 2 seconds
- "Recent Transactions" table updates (if visible)

**What to say:**
> "HQ Operations receives a new shipment from the factory. Let's register these filters on the blockchain."
> 
> *[After submission]*
> 
> "Notice the transaction ID - this is the immutable blockchain proof. Every action is recorded permanently with a cryptographic hash. This transaction is now committed to the blockchain."

**Key point:** Emphasize the transaction ID as proof of blockchain recording.

---

#### Step 2: Show Blockchain Database Update

**What to do:**
1. Switch to CouchDB tab (http://localhost:5984/_utils)
2. Refresh the page (or click refresh icon)
3. Click on `ch1_lifestraw` database in left sidebar
4. Click "All Documents" tab

**What the screen shows:**
- `ch1_lifestraw` database now appears in the list
- Three JSON documents appear:
  - `filter-001`
  - `filter-002`
  - `filter-003`
- Each document shows:
  - `state: "REGISTERED"`
  - `batchId: "DEMO-2024-001"`
  - `_rev` field (revision number)
  - Timestamp

**What to say:**
> "Watch the blockchain update in real-time. I just registered three filters, and here they are in the blockchain database - three immutable records created within 2 seconds."
> 
> *[Point to a document]*
> 
> "Each document represents a filter unit. Notice the `_rev` field - this is the revision number. Every update creates a new revision, preserving history forever."

**Key point:** Show that blockchain updates happen immediately and data is immutable.

---

#### Step 2: HQ Operations - Ship to Warehouse

**What to do:**
1. Still on HQ Operations page
2. Click "Ship Batch" button
3. Fill in:
   ```
   Batch ID: DEMO-2024-001
   Destination: WAREHOUSE-KAMPALA
   Unit IDs: filter-001, filter-002, filter-003
   ```
4. Click "Submit"
5. Show success message with TX ID

**What the screen shows:**
- Success message: "✓ Verified on Blockchain"
- Transaction ID displayed
- Recent Transactions table shows new SHIPPED event

**What to say:**
> "HQ ships the batch to a field warehouse in Kampala. The blockchain updates the state of all three filters simultaneously."
> 
> *[After submission]*
> 
> "Another transaction ID - another immutable record. All three filters are now tracked as shipped."

---

#### Step 3: Show State Change in Blockchain

**What to do:**
1. Go back to CouchDB tab
2. Refresh the page
3. Click on `filter-001` document to view details

**What the screen shows:**
- Document shows updated state:
  - `state: "SHIPPED"` (changed from REGISTERED)
  - `destination: "WAREHOUSE-KAMPALA"`
  - `_rev` number has incremented (e.g., from `1-xxx` to `2-yyy`)
  - New timestamp

**What to say:**
> "Look at the blockchain state change. The `state` field changed from REGISTERED to SHIPPED. Notice the `_rev` number incremented - this is immutability in action. The blockchain doesn't delete old data - it creates new revisions."
> 
> *[Point to _rev field]*
> 
> "Old state: revision 1. New state: revision 2. Both are preserved forever. This eliminates the data loss problem."

**Key point:** Emphasize immutability - old data is never deleted, only new revisions created.

---

### Act 2: Local NGO Receives Batch (2 minutes)

#### Step 4: Local NGO Manager - Receive at Warehouse

**What to do:**
1. Go back to app homepage
2. Click "Local NGO Manager" card
3. Click "Bulk Receive" button
4. Fill in:
   ```
   Unit ID: filter-001
   Warehouse ID: WAREHOUSE-KAMPALA
   ```
5. Click "Submit"

**What the screen shows:**
- Success message with TX ID
- Recent Transactions table shows RECEIVED event
- Transaction ID column shows blockchain icon + hash

**What to say:**
> "The local NGO manager confirms receipt at the warehouse. This creates chain of custody - we now know exactly where this filter is and that it arrived safely."
> 
> *[After submission]*
> 
> "The state changes from SHIPPED to RECEIVED. This is a critical checkpoint - the filter is now in the local NGO's custody and ready for field deployment."

---

### Act 3: Field Operations (3 minutes)

#### Step 5: Field Agent - Receive at Warehouse (Optional - if different from NGO receive)

**What to do:**
1. Go back to app homepage
2. Click "Field Agent" card
3. Click "Receive at Warehouse" button
4. Fill in:
   ```
   Unit ID: filter-001
   Warehouse ID: WAREHOUSE-KAMPALA
   ```
5. Click "Submit"

**What the screen shows:**
- Success message with TX ID
- Recent Transactions table shows RECEIVED event
- Transaction ID column shows blockchain icon + hash

**What to say:**
> "A field agent can also confirm receipt if they pick up directly from the warehouse. This creates chain of custody - we now know exactly where this filter is."

---

#### Step 6: Field Agent - Receive & Verify at Site

**What to do:**
1. Still on Field Agent page
2. Click "Receive & Verify at Site" button
3. Fill in:
   ```
   Unit ID: filter-001
   Site ID: SCHOOL-001
   Verifier ID: agent-john
   ```
4. Click "Submit"

**What the screen shows:**
- Success message with TX ID
- Recent Transactions table shows INSTALLED event (verified delivery)
- Homepage "Lives Impacted" counter increases (if you go back)

**What to say:**
> "The field agent receives the filter at a community site and verifies its authenticity. This is where impact begins - a child now has access to safe water."
> 
> *[After submission]*
> 
> "The blockchain now records exactly where this filter is providing clean water, who verified it, and when. Notice the 'Lives Impacted' counter updated - this represents verified delivery."

**Key point:** Connect verification to impact metrics.

---

#### Step 7: Show Complete History in Blockchain

**What to do:**
1. Go back to CouchDB tab
2. Refresh and click on `filter-001` document
3. Show the complete JSON structure

**What the screen shows:**
- Document shows complete history:
  - `state: "INSTALLED"` (verified delivery)
  - `batchId: "DEMO-2024-001"`
  - `siteId: "SCHOOL-001"`
  - `installerId: "agent-john"` (verifier ID)
  - `warehouseId: "WAREHOUSE-KAMPALA"`
  - `_rev: "4-xxx"` (multiple revisions)

**What to say:**
> "Look at the complete blockchain record. We can see the entire journey: registered → shipped → received → verified at site. Every step is permanently recorded with timestamps and transaction IDs."
> 
> *[Point to different fields]*
> 
> "This is transparency. Donors can verify exactly where their contribution went. No delays, no data gaps, no manual reporting errors."

---

### Act 4: Transparency & Auditing (3 minutes)

#### Step 7: HQ Operations - Track & Audit

**What to do:**
1. Still on HQ Operations page (or go back to homepage and click "HQ Operations")
2. Scroll down to the search section
3. Type `filter-001` in search box
4. Click "Search"

**What the screen shows:**
- Search results show `filter-001`
- Click on the result to expand
- Complete history timeline appears:
  - ✓ REGISTERED - [timestamp]
  - ✓ SHIPPED - [timestamp]
  - ✓ RECEIVED - [timestamp]
  - ✓ VERIFIED (INSTALLED) - [timestamp]
- Each event shows transaction ID

**What to say:**
> "HQ can track and audit any filter's complete history. Let's check our verified filter."
> 
> *[Show the timeline]*
> 
> "Every transaction has a timestamp, organization ID, and is cryptographically signed. This is immutable proof of delivery. No one can alter this history - that's the power of blockchain."

**Key point:** Emphasize immutability and auditability. Show that HQ has three functions: Register, Ship, and Track (Search).

---

#### Step 8: Show Transaction IDs in Table

**What to do:**
1. Scroll down to "Recent Transactions" table
2. Point to the TX ID column

**What the screen shows:**
- Table shows:
  - Unit column
  - Event column (with checkmark icons)
  - TX ID column (with blockchain icons + truncated hashes)
  - Time column
- Multiple transactions visible

**What to say:**
> "Every action creates a transaction with a unique cryptographic hash. These transaction IDs are the proof - you can verify them on the blockchain. Notice the checkmark icons - these indicate verified blockchain transactions."

---

#### Step 10: Donor Dashboard - Impact Metrics

**What to do:**
1. Go back to homepage
2. Click "Donor" card
3. Show the dashboard

**What the screen shows:**
- Impact message: "Every LifeStraw filter provides safe drinking water..."
- Statistics cards:
  - Total Filters Registered
  - Verified Deliveries
  - Replacement Compliance
  - Filters Lost/Damaged
- "Lives Impacted This Year" counter
- Filter Status Breakdown (pie chart or list)
- Recent Transactions table
- "Blockchain Transparency" note

**What to say:**
> "Donors can see real-time impact metrics without any manual reporting delays. Every number here is verified on the blockchain."
> 
> *[Point to verified deliveries]*
> 
> "This represents filters that were actually verified at site - verified delivery, not just shipped. The blockchain ensures accuracy."
> 
> *[Point to lives impacted]*
> 
> "Each verified delivery represents one child receiving safe water for a full year. This is transparent, real-time impact tracking."

**Key point:** Emphasize real-time, verified metrics vs. delayed manual reporting.

---

### Closing (1 minute)

**What to do:**
- Go back to CouchDB tab
- Show the `ch1_lifestraw` database with multiple documents
- Point to transaction IDs

**What the screen shows:**
- Multiple filter unit documents in CouchDB
- Each with different states and revision numbers

**What to say:**
> "This is the power of blockchain verification. Every filter operation is permanently recorded, cryptographically secured, and visible in real-time."
> 
> *[Summarize key benefits]*
> 
> "We've eliminated the 2-3 week verification delay - transactions appear in seconds. We've eliminated the 30% data gap - every action is recorded. We've created complete transparency - donors can verify impact, HQ can audit everything."
> 
> "This is immutable proof of delivery, powered by Hyperledger Fabric blockchain."

---

## 🎓 Advanced Demo (If Time Permits)

### Show Multiple Filters in CouchDB

**What to do:**
- In CouchDB, show multiple filter documents side by side
- Compare different states (REGISTERED, SHIPPED, INSTALLED/VERIFIED)

**What to say:**
> "Here you can see the entire blockchain state. Every filter unit is a document. You can query, search, and audit the complete ledger."

---

### Show Transaction History Table

**What to do:**
- Point to the TX ID column in Recent Transactions
- Explain that each TX ID is a cryptographic hash

**What to say:**
> "Each transaction ID is a cryptographic hash - unique, tamper-proof proof that the transaction occurred. You can verify any transaction on the blockchain."

---

## 🎤 Key Talking Points (Memorize These)

1. **Problem:** "30% data gaps, 2-3 week delays in manual reporting"
2. **Solution:** "Blockchain creates immutable records in seconds"
3. **Immutability:** "Old data is never deleted - only new revisions created"
4. **Transparency:** "Donors can verify impact, HQ can audit everything"
5. **Real-time:** "Transactions appear in blockchain within 2 seconds"
6. **Proof:** "Every transaction has a cryptographic hash - tamper-proof proof"

---

## ⚠️ Troubleshooting During Demo

**If CouchDB doesn't show updates:**
- Wait 2-3 seconds after transaction
- Refresh CouchDB page
- Check backend console for errors

**If transaction fails:**
- Check browser console (F12)
- Check backend terminal for errors
- Verify Fabric network is running: `docker ps | grep peer`

**If database doesn't appear:**
- Make sure you've submitted at least one transaction
- Refresh CouchDB page
- Check that network was started with `-s couchdb`

---

## 📊 Demo Flow Summary

1. **Open app** → Show homepage with mission & impact
2. **Register batch** → Show TX ID, then show CouchDB update
3. **Ship batch** → Show state change in CouchDB (_rev increments)
4. **Receive & Install** → Show complete history
5. **Search in HQ Ops** → Show audit trail
6. **Donor dashboard** → Show impact metrics
7. **CouchDB final view** → Show all blockchain data

**Total time:** 10-15 minutes

---

Good luck! 🚀
