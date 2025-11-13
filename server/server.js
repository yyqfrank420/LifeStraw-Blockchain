const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { getGateway } = require('./fabric/gateway');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || require('crypto').randomBytes(32).toString('hex');

// Log API key ONLY in development mode (never in production!)
if (process.env.NODE_ENV !== 'production') {
    console.log(`⚠️  DEV MODE - API Key: ${API_KEY}`);
    console.log(`⚠️  Set API_KEY environment variable for production!`);
} else {
    console.log('✓ Running in production mode - API key configured from environment');
}

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
        'http://localhost:5173', 
        'http://localhost:3000',
        /^http:\/\/192\.168\./,  // Allow local network IPs (eduroam, etc.)
        /^http:\/\/10\./,         // Allow 10.x.x.x networks
        /\.ngrok-free\.app$/,     // Allow any ngrok URL
        /\.ngrok\.io$/,           // Allow legacy ngrok URLs
        /\.vercel\.app$/          // Allow Vercel deployments
    ],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Key middleware for write operations
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Invalid or missing API key' });
    }
    next();
};

// ID format validation
function validateBatchId(batchId) {
    const batchRegex = /^batch-\d{4}-\d{3,}$/;
    return batchRegex.test(batchId);
}

function validateUnitId(unitId) {
    const unitRegex = /^b-\d{4}-u-\d{3,}$/;
    return unitRegex.test(unitId);
}

// Helper function to update SQLite cache after successful Fabric transaction
function updateCache(eventType, unitId, txId, result, org = 'Org1MSP') {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        
        // Insert event
        db.insertEvent(txId, unitId, eventType, timestamp, org, 'COMMITTED', result);
        
        // Get existing unit to preserve fields
        const existingUnit = db.getUnit(unitId);
    
    // Update unit state based on event type
    // CRITICAL: Always preserve batchId - it's the association between unit and batch
    // batchId is set during REGISTERED and must be preserved through all lifecycle events
    let state = null;
        let batchId = existingUnit?.batchId || null; // Preserve batchId from existing unit
        let siteId = existingUnit?.siteId || null;
        let warehouseId = existingUnit?.warehouseId || null;
        let verifierId = existingUnit?.verifierId || null;
    
    switch (eventType) {
        case 'REGISTERED':
            state = 'REGISTERED';
            batchId = result.batchId || batchId; // Set batchId on registration
            break;
        case 'SHIPPED':
            state = 'SHIPPED';
            batchId = result.batchId || batchId; // Preserve batchId from result or existing
            // Preserve warehouseId if it exists
            break;
        case 'RECEIVED':
            state = 'RECEIVED';
            warehouseId = result.warehouseId || warehouseId;
            // batchId is preserved from existingUnit (already set above)
            break;
        case 'VERIFIED':
            state = 'VERIFIED';
            siteId = result.siteId || siteId;
            verifierId = result.verifierId || verifierId;
            // batchId is preserved from existingUnit (already set above)
            break;
        case 'REPLACED':
            state = 'REPLACED';
            siteId = result.siteId || siteId;
            // batchId is preserved from existingUnit (already set above)
            break;
        case 'FLAGGED':
            state = 'LOST_OR_DAMAGED';
            // Preserve all existing fields including batchId
            break;
    }
    
        if (state) {
            // Always include batchId in upsert - it's critical for batch-unit association
            db.upsertUnit(unitId, state, batchId, siteId, warehouseId, verifierId, timestamp, eventType);
        }
    } catch (error) {
        // Log cache update failure but don't fail the transaction
        // Blockchain is source of truth, cache is just for performance
        console.error(`Cache update failed for ${unitId} (TX: ${txId}):`, error.message);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/register - Register new batch
app.post('/api/register', apiKeyMiddleware, async (req, res) => {
    try {
        const { batchId, unitIds } = req.body;
        
        if (!batchId || !unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
            return res.status(400).json({ error: 'Batch ID and non-empty unitIds array are required' });
        }

        const gateway = await getGateway();
        const result = await gateway.submitTransaction('RegisterBatch', batchId, JSON.stringify(unitIds));
        
        // Update cache for each unit
        for (const unitId of unitIds) {
            updateCache('REGISTERED', unitId, result.txId, { ...result, batchId }, 'Org1MSP');
        }
        
        res.json({
            success: true,
            txId: result.txId,
            batchId: result.batchId,
            unitCount: result.unitCount,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Register error:', error);
        const message = error.message || 'Failed to register batch';
        if (message.includes('already exists')) {
            res.status(409).json({ error: 'One or more units already exist. Each unit can only be registered once.' });
        } else {
            res.status(500).json({ error: message });
        }
    }
});

// POST /api/ship - Ship batch (infers unit IDs from batch ID)
app.post('/api/ship', apiKeyMiddleware, async (req, res) => {
    try {
        const { batchId, destination } = req.body;
        
        if (!batchId || !destination) {
            return res.status(400).json({ error: 'Batch ID and destination are required' });
        }

        // Get all units in this batch from cache
        const unitsInBatch = db.getUnitsByBatch(batchId);
        
        if (!unitsInBatch || unitsInBatch.length === 0) {
            return res.status(404).json({ error: `No units found for batch ${batchId}. Please register the batch first.` });
        }

        // Extract unit IDs
        const unitIds = unitsInBatch.map(unit => unit.unitId);

        const gateway = await getGateway();
        const result = await gateway.submitTransaction('ShipBatch', batchId, destination, JSON.stringify(unitIds));
        
        // Update cache for each unit
        for (const unitId of unitIds) {
            updateCache('SHIPPED', unitId, result.txId, { ...result, destination }, 'Org1MSP');
        }
        
        res.json({
            success: true,
            txId: result.txId,
            batchId: result.batchId,
            destination: result.destination,
            unitCount: result.unitCount,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Ship error:', error);
        const message = error.message || 'Failed to ship batch';
        if (message.includes('not found')) {
            res.status(404).json({ error: 'One or more units not found. Please register the batch first.' });
        } else if (message.includes('cannot be shipped from state')) {
            res.status(400).json({ error: 'All units must be registered before shipping.' });
        } else {
            res.status(500).json({ error: message });
        }
    }
});

// POST /api/receive - Receive at warehouse (accepts both batchId and unitId)
app.post('/api/receive', apiKeyMiddleware, async (req, res) => {
    try {
        const { batchId, unitId, warehouseId } = req.body;
        
        if (!warehouseId) {
            return res.status(400).json({ error: 'Warehouse ID is required' });
        }

        if (!batchId && !unitId) {
            return res.status(400).json({ error: 'Either batch ID or unit ID is required' });
        }

        const gateway = await getGateway();
        let unitIds = [];
        
        // If batchId is provided, get all units in that batch
        if (batchId) {
            const unitsInBatch = db.getUnitsByBatch(batchId);
            if (!unitsInBatch || unitsInBatch.length === 0) {
                return res.status(404).json({ error: `No units found for batch ${batchId}. Please register the batch first.` });
            }
            unitIds = unitsInBatch.map(unit => unit.unitId);
        } else {
            // If only unitId is provided, use just that unit
            unitIds = [unitId];
        }

        // Process each unit
        const results = [];
        const errors = [];
        
        for (const currentUnitId of unitIds) {
            try {
                const result = await gateway.submitTransaction('ReceiveAtWarehouse', currentUnitId, warehouseId);
                updateCache('RECEIVED', currentUnitId, result.txId, result, 'Org1MSP');
                results.push({
                    unitId: result.unitId,
                    txId: result.txId,
                    warehouseId: result.warehouseId,
                    timestamp: result.timestamp
                });
            } catch (unitError) {
                errors.push({
                    unitId: currentUnitId,
                    error: unitError.message || 'Failed to receive unit'
                });
            }
        }

        // If all failed, return error
        if (results.length === 0) {
            const firstError = errors[0];
            const message = firstError.error;
            if (message.includes('not found')) {
                return res.status(404).json({ error: 'Unit not found. Please register the unit first.' });
            } else if (message.includes('cannot be received from state')) {
                return res.status(400).json({ error: 'Unit must be shipped before it can be received at warehouse.' });
            } else {
                return res.status(500).json({ error: message });
            }
        }

        // Return success with results
        res.json({
            success: true,
            batchId: batchId || null,
            unitCount: results.length,
            results: results,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: results[0]?.timestamp
        });
    } catch (error) {
        console.error('Receive error:', error);
        const message = error.message || 'Failed to receive unit';
        if (message.includes('not found')) {
            res.status(404).json({ error: 'Unit not found. Please register the unit first.' });
        } else if (message.includes('cannot be received from state')) {
            res.status(400).json({ error: 'Unit must be shipped before it can be received at warehouse.' });
        } else {
            res.status(500).json({ error: message });
        }
    }
});

// POST /api/install - Install at site
app.post('/api/install', apiKeyMiddleware, async (req, res) => {
    try {
        const { unitId, siteId, verifierId } = req.body;
        
        if (!unitId || !siteId || !verifierId) {
            return res.status(400).json({ error: 'Unit ID, site ID, and verifier ID are required' });
        }

        const gateway = await getGateway();
        const result = await gateway.submitTransaction('VerifyAtSite', unitId, siteId, verifierId);
        
        updateCache('VERIFIED', unitId, result.txId, result, 'Org1MSP');
        
        res.json({
            success: true,
            txId: result.txId,
            unitId: result.unitId,
            siteId: result.siteId,
            verifierId: result.verifierId,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Verify error:', error);
        const message = error.message || 'Failed to verify unit';
        if (message.includes('not found')) {
            res.status(404).json({ error: 'Unit not found. Please register it first.' });
        } else if (message.includes('cannot be verified')) {
            res.status(409).json({ error: 'Unit must be received at warehouse before verification.' });
        } else {
            res.status(500).json({ error: message });
        }
    }
});

// POST /api/replace - Replace unit
app.post('/api/replace', apiKeyMiddleware, async (req, res) => {
    try {
        const { oldUnitId, newUnitId, siteId } = req.body;
        
        if (!oldUnitId || !newUnitId || !siteId) {
            return res.status(400).json({ error: 'Old unit ID, new unit ID, and site ID are required' });
        }

        const gateway = await getGateway();
        const result = await gateway.submitTransaction('ReplaceUnit', oldUnitId, newUnitId, siteId);
        
        // Update both old and new units
        updateCache('REPLACED', oldUnitId, result.txId, { ...result, replacedBy: newUnitId }, 'Org1MSP');
        updateCache('VERIFIED', newUnitId, result.txId, { ...result, replacedUnit: oldUnitId }, 'Org1MSP');
        
        res.json({
            success: true,
            txId: result.txId,
            oldUnitId: result.oldUnitId,
            newUnitId: result.newUnitId,
            siteId: result.siteId,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Replace error:', error);
        const message = error.message || 'Failed to replace unit';
        if (message.includes('not found')) {
            res.status(404).json({ error: 'One or both units not found. Please register missing units first.' });
        } else if (message.includes('cannot be replaced from state')) {
            res.status(400).json({ error: 'Only verified units can be replaced.' });
        } else if (message.includes('cannot be verified from state')) {
            res.status(400).json({ error: 'Replacement unit must be received or registered before verification.' });
        } else {
            res.status(500).json({ error: message });
        }
    }
});

// POST /api/flag - Flag lost/damaged
app.post('/api/flag', apiKeyMiddleware, async (req, res) => {
    try {
        const { unitId, reason } = req.body;
        
        if (!unitId || !reason) {
            return res.status(400).json({ error: 'Unit ID and reason (LOST or DAMAGED) are required' });
        }

        if (reason !== 'LOST' && reason !== 'DAMAGED') {
            return res.status(400).json({ error: 'Reason must be either LOST or DAMAGED' });
        }

        const gateway = await getGateway();
        const result = await gateway.submitTransaction('FlagLostDamaged', unitId, reason);
        
        updateCache('FLAGGED', unitId, result.txId, result, 'Org1MSP');
        
        res.json({
            success: true,
            txId: result.txId,
            unitId: result.unitId,
            reason: result.reason,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Flag error:', error);
        const message = error.message || 'Failed to flag unit';
        if (message.includes('not found')) {
            res.status(404).json({ error: 'Unit not found. Please register the unit first.' });
        } else if (message.includes('cannot be flagged from state')) {
            res.status(400).json({ error: 'This unit cannot be flagged. It may already be lost/damaged or replaced.' });
        } else {
            res.status(500).json({ error: message });
        }
    }
});

// GET /api/read/:unitId - Query unit history
app.get('/api/read/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        
        if (!unitId) {
            return res.status(400).json({ error: 'Unit ID is required' });
        }

        const gateway = await getGateway();
        const result = await gateway.evaluateTransaction('ReadUnit', unitId);
        // Result is already a JSON object from gateway
        const unitData = typeof result === 'string' ? JSON.parse(result) : result;
        
        // Sync batchId from blockchain to SQLite cache
        // This ensures SQLite always has the correct batchId association
        // Blockchain is the source of truth for batchId
        if (unitData.batchId) {
            const existingUnit = db.getUnit(unitId);
            const timestamp = unitData.lastUpdated || Math.floor(Date.now() / 1000);
            
            // Always update cache with batchId from blockchain (source of truth)
            db.upsertUnit(
                unitId,
                unitData.state,
                unitData.batchId, // Use batchId from blockchain - this is the authoritative source
                unitData.siteId || existingUnit?.siteId || null,
                unitData.warehouseId || existingUnit?.warehouseId || null,
                unitData.verifierId || existingUnit?.verifierId || null,
                timestamp,
                existingUnit?.lastEventType || 'READ'
            );
        }
        
        res.json({
            success: true,
            unit: unitData
        });
    } catch (error) {
        console.error('Read error:', error);
        res.status(500).json({ error: error.message || 'Failed to read unit' });
    }
});

// GET /api/recent - Recent events from SQLite
app.get('/api/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const events = db.getRecentEvents(limit);
        
        res.json({
            success: true,
            events,
            count: events.length
        });
    } catch (error) {
        console.error('Recent events error:', error);
        res.status(500).json({ error: error.message || 'Failed to get recent events' });
    }
});

// GET /api/stats - Aggregate statistics
app.get('/api/stats', async (req, res) => {
    try {
        const stats = db.getStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message || 'Failed to get statistics' });
    }
});

// Search endpoint - Search units by unitId, batchId, siteId, or warehouseId
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const results = db.searchUnits(q);
        
        // Return results with batchId included
        // Note: batchId is stored in both blockchain (source of truth) and SQLite (cache)
        // The batchId association is maintained throughout the unit lifecycle
        const formattedResults = results.map(unit => ({
            unitId: unit.unitId,
            state: unit.state,
            batchId: unit.batchId, // Always included - stored in SQLite and synced from blockchain
            siteId: unit.siteId,
            warehouseId: unit.warehouseId
        }));
        
        res.json({
            success: true,
            results: formattedResults,
            count: formattedResults.length
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message || 'Failed to search units' });
    }
});

// GET /api/blockchain/blocks - Explain blockchain architecture
// NOTE: Direct block querying requires peer ledger service access
// Transaction IDs in /api/recent are from actual blockchain blocks
app.get('/api/blockchain/blocks', async (req, res) => {
    try {
        const gateway = await getGateway();
        const result = await gateway.queryBlocks();
        
        // Get recent transactions (these have real TX IDs from blockchain)
        const recentEvents = db.getRecentEvents(20);
        
        res.json({
            success: true,
            blocks: result.blocks,
            latestBlockNumber: result.latestBlockNumber,
            totalBlocks: result.totalBlocks,
            note: result.note,
            architecture: result.architecture,
            recentTransactions: recentEvents.map(e => ({
                txId: e.txId,
                unitId: e.unitId,
                eventType: e.eventType,
                timestamp: e.ts
            })),
            source: 'blockchain_ledger',
            message: 'Transaction IDs shown are from actual blockchain blocks. CouchDB state is derived from these blocks.'
        });
    } catch (error) {
        console.error('Blockchain query error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'blockchain_ledger'
        });
    }
});

// GET /api/blockchain/documents - Fetch current state from CouchDB (query layer)
// NOTE: This shows CouchDB state (cache), not the blockchain ledger itself
app.get('/api/blockchain/documents', async (req, res) => {
    try {
        const axios = require('axios');
        const couchDBUrl = 'http://admin:adminpw@localhost:5984/ch1_lifestraw/_all_docs?include_docs=true';
        
        const response = await axios.get(couchDBUrl);
        const documents = response.data.rows
            .filter(row => !row.id.startsWith('_')) // Filter out system docs
            .map(row => ({
                id: row.id,
                rev: row.doc._rev,
                state: row.doc.state,
                batchId: row.doc.batchId,
                siteId: row.doc.siteId,
                warehouseId: row.doc.warehouseId,
                verifierId: row.doc.verifierId,
                history: row.doc.history || [],
                timestamp: row.doc.timestamp
            }));
        
        res.json({ 
            success: true, 
            documents,
            total: documents.length,
            couchDBStatus: 'connected',
            source: 'couchdb_state', // Emphasize this is state cache, not blockchain
            note: 'CouchDB is a query layer - the blockchain ledger is the source of truth'
        });
    } catch (error) {
        console.error('CouchDB fetch error:', error.message);
        res.json({ 
            success: false, 
            documents: [],
            total: 0,
            couchDBStatus: 'unavailable',
            error: error.message,
            source: 'couchdb_state'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        // Initialize Fabric Gateway
        console.log('Initializing Fabric Gateway...');
        await getGateway();
        console.log('Fabric Gateway initialized');
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`API Key: ${API_KEY}`);
            console.log(`CORS origins: ${process.env.CORS_ORIGIN || 'http://localhost:5173, http://localhost:3000'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        console.error('Make sure Fabric network is running and wallet is set up.');
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    try {
        const gateway = await getGateway();
        await gateway.disconnect();
    } catch (error) {
        console.error('Error during shutdown:', error);
    }
    process.exit(0);
});

startServer();

