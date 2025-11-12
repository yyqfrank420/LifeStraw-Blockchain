/*
 * LifeStraw Filter Lifecycle Chaincode
 * Tracks the complete lifecycle of water filters from manufacture to replacement/loss
 */

const { Contract } = require('fabric-contract-api');

class LifeStrawContract extends Contract {
    constructor() {
        super('LifeStrawContract');
    }

    /**
     * Initialize the contract
     */
    async InitLedger(ctx) {
        console.info('LifeStraw chaincode initialized');
    }

    /**
     * RegisterBatch - Create new filter units in a batch
     * @param {string} batchId - Unique batch identifier
     * @param {string} unitIds - JSON array of unit IDs
     */
    async RegisterBatch(ctx, batchId, unitIds) {
        if (!batchId || !unitIds) {
            throw new Error('Batch ID and unit IDs are required');
        }

        const unitIdArray = JSON.parse(unitIds);
        if (!Array.isArray(unitIdArray) || unitIdArray.length === 0) {
            throw new Error('Unit IDs must be a non-empty array');
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const org = ctx.clientIdentity.getMSPID();

        // Register each unit
        for (const unitId of unitIdArray) {
            const unitKey = ctx.stub.createCompositeKey('unit', [unitId]);
            
            // Check if unit already exists
            const existingUnit = await ctx.stub.getState(unitKey);
            if (existingUnit && existingUnit.length > 0) {
                throw new Error(`Unit ${unitId} already exists`);
            }

            const unitState = {
                unitId: unitId,
                batchId: batchId,
                state: 'REGISTERED',
                createdAt: timestamp,
                org: org,
                history: [{
                    eventType: 'REGISTERED',
                    timestamp: timestamp,
                    org: org,
                    batchId: batchId
                }]
            };

            await ctx.stub.putState(unitKey, Buffer.from(JSON.stringify(unitState)));
        }

        return {
            success: true,
            batchId: batchId,
            unitCount: unitIdArray.length,
            timestamp: timestamp
        };
    }

    /**
     * ShipBatch - Mark a batch as shipped to a destination
     * @param {string} batchId - Batch identifier
     * @param {string} destination - Shipping destination
     * @param {string} unitIds - JSON array of unit IDs in the batch
     */
    async ShipBatch(ctx, batchId, destination, unitIds) {
        if (!batchId || !destination || !unitIds) {
            throw new Error('Batch ID, destination, and unit IDs are required');
        }

        const unitIdArray = JSON.parse(unitIds);
        const timestamp = Math.floor(Date.now() / 1000);
        const org = ctx.clientIdentity.getMSPID();

        const updatedUnits = [];

        for (const unitId of unitIdArray) {
            const unitKey = ctx.stub.createCompositeKey('unit', [unitId]);
            const unitBytes = await ctx.stub.getState(unitKey);
            
            if (!unitBytes || unitBytes.length === 0) {
                throw new Error(`Unit ${unitId} not found`);
            }

            const unitState = JSON.parse(unitBytes.toString());
            
            if (unitState.state !== 'REGISTERED') {
                throw new Error(`Unit ${unitId} cannot be shipped from state ${unitState.state}`);
            }

            unitState.state = 'SHIPPED';
            unitState.shippedAt = timestamp;
            unitState.destination = destination;
            unitState.history.push({
                eventType: 'SHIPPED',
                timestamp: timestamp,
                org: org,
                destination: destination
            });

            await ctx.stub.putState(unitKey, Buffer.from(JSON.stringify(unitState)));
            updatedUnits.push(unitId);
        }

        return {
            success: true,
            batchId: batchId,
            destination: destination,
            unitCount: updatedUnits.length,
            timestamp: timestamp
        };
    }

    /**
     * ReceiveAtWarehouse - Record receipt at warehouse
     * @param {string} unitId - Unit identifier
     * @param {string} warehouseId - Warehouse identifier
     */
    async ReceiveAtWarehouse(ctx, unitId, warehouseId) {
        if (!unitId || !warehouseId) {
            throw new Error('Unit ID and warehouse ID are required');
        }

        const unitKey = ctx.stub.createCompositeKey('unit', [unitId]);
        const unitBytes = await ctx.stub.getState(unitKey);
        
        if (!unitBytes || unitBytes.length === 0) {
            throw new Error(`Unit ${unitId} not found`);
        }

        const unitState = JSON.parse(unitBytes.toString());
        
        if (unitState.state !== 'SHIPPED') {
            throw new Error(`Unit ${unitId} cannot be received from state ${unitState.state}`);
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const org = ctx.clientIdentity.getMSPID();

        unitState.state = 'RECEIVED';
        unitState.receivedAt = timestamp;
        unitState.warehouseId = warehouseId;
        unitState.history.push({
            eventType: 'RECEIVED',
            timestamp: timestamp,
            org: org,
            warehouseId: warehouseId
        });

        await ctx.stub.putState(unitKey, Buffer.from(JSON.stringify(unitState)));

        return {
            success: true,
            unitId: unitId,
            warehouseId: warehouseId,
            timestamp: timestamp
        };
    }

    /**
     * VerifyAtSite - Record verification of unit delivery at a site
     * @param {string} unitId - Unit identifier
     * @param {string} siteId - Site identifier
     * @param {string} verifierId - Verifier identifier
     */
    async VerifyAtSite(ctx, unitId, siteId, verifierId) {
        if (!unitId || !siteId || !verifierId) {
            throw new Error('Unit ID, site ID, and verifier ID are required');
        }

        const unitKey = ctx.stub.createCompositeKey('unit', [unitId]);
        const unitBytes = await ctx.stub.getState(unitKey);
        
        if (!unitBytes || unitBytes.length === 0) {
            throw new Error(`Unit ${unitId} not found`);
        }

        const unitState = JSON.parse(unitBytes.toString());
        
        if (unitState.state !== 'RECEIVED') {
            throw new Error(`Unit ${unitId} cannot be verified from state ${unitState.state}`);
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const org = ctx.clientIdentity.getMSPID();

        unitState.state = 'VERIFIED';
        unitState.verifiedAt = timestamp;
        unitState.siteId = siteId;
        unitState.verifierId = verifierId;
        unitState.history.push({
            eventType: 'VERIFIED',
            timestamp: timestamp,
            org: org,
            siteId: siteId,
            verifierId: verifierId
        });

        await ctx.stub.putState(unitKey, Buffer.from(JSON.stringify(unitState)));

        return {
            success: true,
            unitId: unitId,
            siteId: siteId,
            verifierId: verifierId,
            timestamp: timestamp
        };
    }

    /**
     * ReplaceUnit - Handle replacement of an old unit with a new one
     * @param {string} oldUnitId - Old unit identifier
     * @param {string} newUnitId - New unit identifier
     * @param {string} siteId - Site identifier
     */
    async ReplaceUnit(ctx, oldUnitId, newUnitId, siteId) {
        if (!oldUnitId || !newUnitId || !siteId) {
            throw new Error('Old unit ID, new unit ID, and site ID are required');
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const org = ctx.clientIdentity.getMSPID();

        // Update old unit
        const oldUnitKey = ctx.stub.createCompositeKey('unit', [oldUnitId]);
        const oldUnitBytes = await ctx.stub.getState(oldUnitKey);
        
        if (!oldUnitBytes || oldUnitBytes.length === 0) {
            throw new Error(`Old unit ${oldUnitId} not found`);
        }

        const oldUnitState = JSON.parse(oldUnitBytes.toString());
        
        if (oldUnitState.state !== 'VERIFIED') {
            throw new Error(`Old unit ${oldUnitId} cannot be replaced from state ${oldUnitState.state}. Must be VERIFIED.`);
        }

        oldUnitState.state = 'REPLACED';
        oldUnitState.replacedAt = timestamp;
        oldUnitState.replacedBy = newUnitId;
        oldUnitState.history.push({
            eventType: 'REPLACED',
            timestamp: timestamp,
            org: org,
            replacedBy: newUnitId,
            siteId: siteId
        });

        await ctx.stub.putState(oldUnitKey, Buffer.from(JSON.stringify(oldUnitState)));

        // Check if new unit exists and update it
        const newUnitKey = ctx.stub.createCompositeKey('unit', [newUnitId]);
        const newUnitBytes = await ctx.stub.getState(newUnitKey);
        
        if (!newUnitBytes || newUnitBytes.length === 0) {
            throw new Error(`New unit ${newUnitId} not found. Please register it first.`);
        }

        const newUnitState = JSON.parse(newUnitBytes.toString());
        
        // Validate new unit is in a valid state for verification
        if (newUnitState.state !== 'RECEIVED' && newUnitState.state !== 'REGISTERED') {
            throw new Error(`New unit ${newUnitId} cannot be verified from state ${newUnitState.state}. Must be RECEIVED or REGISTERED.`);
        }
        
        newUnitState.state = 'VERIFIED';
        newUnitState.verifiedAt = timestamp;
        newUnitState.siteId = siteId;
        newUnitState.replacedUnit = oldUnitId;
        newUnitState.history.push({
            eventType: 'VERIFIED',
            timestamp: timestamp,
            org: org,
            siteId: siteId,
            replacedUnit: oldUnitId
        });

        await ctx.stub.putState(newUnitKey, Buffer.from(JSON.stringify(newUnitState)));

        return {
            success: true,
            oldUnitId: oldUnitId,
            newUnitId: newUnitId,
            siteId: siteId,
            timestamp: timestamp
        };
    }

    /**
     * FlagLostDamaged - Mark a unit as lost or damaged
     * @param {string} unitId - Unit identifier
     * @param {string} reason - Reason for flagging (LOST or DAMAGED)
     */
    async FlagLostDamaged(ctx, unitId, reason) {
        if (!unitId || !reason) {
            throw new Error('Unit ID and reason are required');
        }

        if (reason !== 'LOST' && reason !== 'DAMAGED') {
            throw new Error('Reason must be either LOST or DAMAGED');
        }

        const unitKey = ctx.stub.createCompositeKey('unit', [unitId]);
        const unitBytes = await ctx.stub.getState(unitKey);
        
        if (!unitBytes || unitBytes.length === 0) {
            throw new Error(`Unit ${unitId} not found`);
        }

        const unitState = JSON.parse(unitBytes.toString());
        
        if (unitState.state === 'LOST_OR_DAMAGED' || unitState.state === 'REPLACED') {
            throw new Error(`Unit ${unitId} cannot be flagged from state ${unitState.state}`);
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const org = ctx.clientIdentity.getMSPID();

        unitState.state = 'LOST_OR_DAMAGED';
        unitState.flaggedAt = timestamp;
        unitState.flagReason = reason;
        unitState.history.push({
            eventType: 'FLAGGED',
            timestamp: timestamp,
            org: org,
            reason: reason
        });

        await ctx.stub.putState(unitKey, Buffer.from(JSON.stringify(unitState)));

        return {
            success: true,
            unitId: unitId,
            reason: reason,
            timestamp: timestamp
        };
    }

    /**
     * ReadUnit - Query unit history and current state
     * @param {string} unitId - Unit identifier
     */
    async ReadUnit(ctx, unitId) {
        if (!unitId) {
            throw new Error('Unit ID is required');
        }

        const unitKey = ctx.stub.createCompositeKey('unit', [unitId]);
        const unitBytes = await ctx.stub.getState(unitKey);
        
        if (!unitBytes || unitBytes.length === 0) {
            throw new Error(`Unit ${unitId} not found`);
        }

        const unitState = JSON.parse(unitBytes.toString());
        
        return {
            unitId: unitState.unitId,
            batchId: unitState.batchId,
            state: unitState.state,
            siteId: unitState.siteId || null,
            warehouseId: unitState.warehouseId || null,
            verifierId: unitState.verifierId || null,
            history: unitState.history || [],
            createdAt: unitState.createdAt,
            lastUpdated: unitState.history[unitState.history.length - 1]?.timestamp || unitState.createdAt
        };
    }
}

module.exports.contracts = [LifeStrawContract];

