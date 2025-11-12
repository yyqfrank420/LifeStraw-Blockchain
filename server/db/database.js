const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'ldvb.db');
const db = new Database(dbPath);

// Initialize schema
function initializeDatabase() {
    // Events table - stores transaction history
    db.exec(`
        CREATE TABLE IF NOT EXISTS events (
            txId TEXT PRIMARY KEY,
            unitId TEXT NOT NULL,
            eventType TEXT NOT NULL,
            ts INTEGER NOT NULL,
            org TEXT,
            status TEXT DEFAULT 'COMMITTED',
            metadata TEXT
        )
    `);

    // Units table - stores current state of units
    db.exec(`
        CREATE TABLE IF NOT EXISTS units (
            unitId TEXT PRIMARY KEY,
            state TEXT NOT NULL,
            batchId TEXT,
            siteId TEXT,
            warehouseId TEXT,
            verifierId TEXT,
            lastTs INTEGER NOT NULL,
            lastEventType TEXT
        )
    `);

    // Create indexes for faster queries
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_events_unitId ON events(unitId);
        CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
        CREATE INDEX IF NOT EXISTS idx_units_state ON units(state);
        CREATE INDEX IF NOT EXISTS idx_units_batchId ON units(batchId);
    `);

    console.log('Database initialized successfully');
}

// Insert event into events table
function insertEvent(txId, unitId, eventType, ts, org, status = 'COMMITTED', metadata = null) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO events (txId, unitId, eventType, ts, org, status, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(txId, unitId, eventType, ts, org, status, metadata ? JSON.stringify(metadata) : null);
}

// Insert or update unit in units table
function upsertUnit(unitId, state, batchId = null, siteId = null, warehouseId = null, verifierId = null, lastTs, lastEventType) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO units (unitId, state, batchId, siteId, warehouseId, verifierId, lastTs, lastEventType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(unitId, state, batchId, siteId, warehouseId, verifierId, lastTs, lastEventType);
}

// Get recent events (last N events)
function getRecentEvents(limit = 25) {
    const stmt = db.prepare(`
        SELECT * FROM events
        ORDER BY ts DESC
        LIMIT ?
    `);
    
    return stmt.all(limit).map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
}

// Get events for a specific unit
function getUnitEvents(unitId) {
    const stmt = db.prepare(`
        SELECT * FROM events
        WHERE unitId = ?
        ORDER BY ts ASC
    `);
    
    return stmt.all(unitId).map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
}

// Get unit by ID
function getUnit(unitId) {
    const stmt = db.prepare(`
        SELECT * FROM units
        WHERE unitId = ?
    `);
    
    return stmt.get(unitId);
}

// Get statistics
function getStats() {
    const totalUnits = db.prepare('SELECT COUNT(*) as count FROM units').get().count;
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    
    const stateCounts = db.prepare(`
        SELECT state, COUNT(*) as count
        FROM units
        GROUP BY state
    `).all();
    
    const eventTypeCounts = db.prepare(`
        SELECT eventType, COUNT(*) as count
        FROM events
        GROUP BY eventType
    `).all();
    
    const verifiedCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM units
        WHERE state = 'VERIFIED'
    `).get().count;
    
    const replacedCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM units
        WHERE state = 'REPLACED'
    `).get().count;
    
    const lostDamagedCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM units
        WHERE state = 'LOST_OR_DAMAGED'
    `).get().count;
    
    return {
        totalUnits,
        totalEvents,
        stateCounts: stateCounts.reduce((acc, row) => {
            acc[row.state] = row.count;
            return acc;
        }, {}),
        eventTypeCounts: eventTypeCounts.reduce((acc, row) => {
            acc[row.eventType] = row.count;
            return acc;
        }, {}),
        verifiedCount,
        replacedCount,
        lostDamagedCount,
        replacementCompliance: totalUnits > 0 && (verifiedCount + replacedCount) > 0 
            ? parseFloat(((replacedCount / (verifiedCount + replacedCount)) * 100).toFixed(2)) 
            : 0,
        verifiedDeliveries: verifiedCount + replacedCount
    };
}

// Get units by batch ID
function getUnitsByBatch(batchId) {
    const stmt = db.prepare(`
        SELECT * FROM units
        WHERE batchId = ?
    `);
    
    return stmt.all(batchId);
}

// Search units by various criteria
function searchUnits(query, limit = 50) {
    const searchTerm = `%${query}%`;
    const stmt = db.prepare(`
        SELECT * FROM units
        WHERE unitId LIKE ? 
           OR batchId LIKE ?
           OR siteId LIKE ?
           OR warehouseId LIKE ?
        LIMIT ?
    `);
    
    return stmt.all(searchTerm, searchTerm, searchTerm, searchTerm, limit);
}

// Initialize on module load
initializeDatabase();

module.exports = {
    db,
    insertEvent,
    upsertUnit,
    getRecentEvents,
    getUnitEvents,
    getUnit,
    getStats,
    getUnitsByBatch,
    searchUnits
};

