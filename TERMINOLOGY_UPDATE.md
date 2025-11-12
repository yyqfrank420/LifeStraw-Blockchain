# Terminology Update: Install → Verify

## Summary

Changed all "install" terminology to "verify" across the entire stack to accurately reflect that we're **verifying delivery**, not installing equipment.

## What Changed

### ✅ Blockchain Events (Chaincode)
- `InstallAtSite()` → `VerifyAtSite()`
- `INSTALLED` state → `VERIFIED` state
- `installerId` field → `verifierId` field
- `installedAt` timestamp → `verifiedAt` timestamp

### ✅ Backend API
- Event type mapping: `INSTALLED` → `VERIFIED`
- Cache logic updated for new field names
- `/api/install` endpoint: now uses `verifierId` instead of `installerId`
- Error messages updated to reference "verification" not "installation"

### ✅ Database Schema
- `units.installerId` column → `units.verifierId` column
- Stats calculation: `installedCount` → `verifiedCount`
- Database recreated with new schema (old data cleared)

### ✅ Frontend UI
- Field Agent: "Verifier ID" instead of "Installer ID"
- All color coding updated: green = `VERIFIED` (was `INSTALLED`)
- Donor Dashboard: displays `verifiedCount` instead of `installedCount`
- HQ Ops: "Verifier ID" in unit history view
- Blockchain Viewer: "Verifier" metadata label

## Blockchain Event Flow

**Current accurate flow:**
1. **REGISTERED** - HQ creates batch
2. **SHIPPED** - HQ ships to field
3. **RECEIVED** - Local NGO receives at warehouse
4. **VERIFIED** - Field Agent verifies delivery at site ✅
5. **REPLACED** - Field Agent replaces unit (new unit also gets VERIFIED)
6. **FLAGGED** - Lost or damaged

## Next Steps

1. Restart the entire stack (Fabric network + backend + frontend)
2. Redeploy chaincode with new function names
3. Test the flow with new terminology

## Commands to Restart

```bash
# Stop everything
cd /Users/yangyuqing/Desktop/blockchain/fabric-samples/test-network
./network.sh down

# Run the demo startup script
cd /Users/yangyuqing/Desktop/blockchain
bash DEMO_DAY_COMMANDS.sh
```

## Why This Matters

- **Accuracy**: We're not installing water filters, we're verifying they were delivered
- **Clarity**: "Verified" better matches the blockchain's purpose: proof of delivery
- **Consistency**: Frontend labels now match blockchain events exactly

