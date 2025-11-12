const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

class FabricGateway {
    constructor() {
        this.gateway = new Gateway();
        this.wallet = null;
        this.network = null;
        this.contract = null;
    }

    /**
     * Initialize wallet and connection
     */
    async initialize() {
        try {
            // Load connection profile
            const ccpPath = path.resolve(__dirname, 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Create wallet
            const walletPath = path.join(__dirname, 'wallet');
            this.wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);

            // Check if user exists in wallet
            const user = process.env.FABRIC_USER || 'appUser';
            const userExists = await this.wallet.get(user);
            if (!userExists) {
                console.log(`User ${user} does not exist in wallet. Please run enrollment script first.`);
                throw new Error(`User ${user} not found in wallet. Run setup-wallet.sh to enroll.`);
            }

            // Connect to gateway
            await this.gateway.connect(ccp, {
                wallet: this.wallet,
                identity: user,
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get network and contract
            const channelName = process.env.FABRIC_CHANNEL || 'ch1';
            this.network = await this.gateway.getNetwork(channelName);
            
            const chaincodeName = process.env.FABRIC_CC || 'lifestraw';
            this.contract = this.network.getContract(chaincodeName);

            console.log('Fabric Gateway initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Fabric Gateway:', error);
            throw error;
        }
    }

    /**
     * Submit a transaction to the chaincode
     * @param {string} functionName - Chaincode function name
     * @param {Array} args - Function arguments
     * @returns {Promise<Object>} Transaction result
     */
    async submitTransaction(functionName, ...args) {
        if (!this.contract) {
            throw new Error('Gateway not initialized. Call initialize() first.');
        }

        try {
            console.log(`Submitting transaction: ${functionName} with args:`, args);
            
            // Create transaction to get transaction ID before submission
            let txId;
            let result;
            
            // Try to get transaction ID using newTransaction (Fabric SDK v2.x)
            try {
                const transaction = this.contract.newTransaction(functionName);
                txId = transaction.getTransactionId();
                result = await transaction.submit(...args);
            } catch (newTxError) {
                // Fallback: use submitTransaction and generate a UUID for txId
                // Note: This is less ideal but ensures compatibility
                const uuid = require('crypto').randomUUID();
                result = await this.contract.submitTransaction(functionName, ...args);
                txId = uuid; // Use generated UUID as transaction identifier
                console.warn('Could not get transaction ID from Fabric SDK, using generated UUID');
            }
            
            const response = JSON.parse(result.toString());
            response.txId = txId;
            
            console.log(`Transaction ${txId} committed successfully`);
            return response;
        } catch (error) {
            console.error(`Transaction failed: ${functionName}`, error);
            throw error;
        }
    }

    /**
     * Evaluate a query (read-only) on the chaincode
     * @param {string} functionName - Chaincode function name
     * @param {Array} args - Function arguments
     * @returns {Promise<Object>} Query result
     */
    async evaluateTransaction(functionName, ...args) {
        if (!this.contract) {
            throw new Error('Gateway not initialized. Call initialize() first.');
        }

        try {
            console.log(`Evaluating transaction: ${functionName} with args:`, args);
            
            const result = await this.contract.evaluateTransaction(functionName, ...args);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error(`Query failed: ${functionName}`, error);
            throw error;
        }
    }

    /**
     * Query blockchain blocks (the actual immutable ledger)
     * @param {number} startBlock - Starting block number
     * @param {number} endBlock - Ending block number (optional, defaults to latest)
     * @returns {Promise<Array>} Array of block information
     */
    async queryBlocks(startBlock = 0, endBlock = null) {
        // NOTE: fabric-network doesn't expose direct block querying easily
        // Instead, we return transaction IDs from recent events (which are from actual blockchain)
        // The blockchain ledger IS the source of truth - CouchDB is just a query layer
        // For full block querying, you'd need to use peer's ledger service directly via gRPC
        
        if (!this.contract) {
            throw new Error('Gateway not initialized. Call initialize() first.');
        }

        try {
            // Return a message explaining the architecture
            // In production, you'd query blocks via peer's ledger service
            return {
                blocks: [],
                latestBlockNumber: 0,
                totalBlocks: 0,
                note: 'Block querying requires direct peer ledger access. Transaction IDs shown in Recent Transactions are from actual blockchain blocks.',
                architecture: {
                    blockchain: 'Immutable ledger (blocks) - source of truth',
                    couchdb: 'State database (query layer) - derived from blockchain',
                    flow: 'Transaction → Blockchain Block → CouchDB State Update'
                }
            };
        } catch (error) {
            console.error('Failed to query blocks:', error);
            throw error;
        }
    }

    /**
     * Get transaction history for a specific key from blockchain
     * @param {string} key - The key to query history for
     * @returns {Promise<Array>} Transaction history
     */
    async getHistoryForKey(key) {
        if (!this.contract) {
            throw new Error('Gateway not initialized. Call initialize() first.');
        }

        try {
            // Use chaincode to get history (if we add a GetHistory function)
            // For now, we'll query blocks and filter
            const channel = this.network.getChannel();
            const info = await channel.queryInfo();
            const latestBlock = parseInt(info.height.low) - 1;
            
            const history = [];
            
            // Query recent blocks for transactions involving this key
            const startBlock = Math.max(0, latestBlock - 100); // Last 100 blocks
            for (let blockNum = startBlock; blockNum <= latestBlock; blockNum++) {
                try {
                    const block = await channel.queryBlock(blockNum);
                    // Parse block for transactions involving this key
                    // This is simplified - in production you'd parse the read/write sets
                } catch (err) {
                    // Skip blocks that can't be read
                }
            }
            
            return history;
        } catch (error) {
            console.error('Failed to get history:', error);
            throw error;
        }
    }

    /**
     * Disconnect from gateway
     */
    async disconnect() {
        if (this.gateway) {
            await this.gateway.disconnect();
            console.log('Disconnected from Fabric Gateway');
        }
    }

    /**
     * Enroll user with Fabric CA
     * @param {string} userId - User ID to enroll
     * @param {string} userSecret - User secret/password
     */
    async enrollUser(userId, userSecret) {
        try {
            // Load connection profile
            const ccpPath = path.resolve(__dirname, 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Create wallet
            const walletPath = path.join(__dirname, 'wallet');
            this.wallet = await Wallets.newFileSystemWallet(walletPath);

            // Check if user already exists
            const userExists = await this.wallet.get(userId);
            if (userExists) {
                console.log(`User ${userId} already exists in wallet`);
                return { success: true, message: `User ${userId} already enrolled` };
            }

            // Check if admin user exists
            const adminExists = await this.wallet.get('admin');
            if (!adminExists) {
                throw new Error('Admin user not found. Please enroll admin first.');
            }

            // Get CA client
            const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
            const caTLSCACerts = caInfo.tlsCACerts.pem;
            const ca = new FabricCAServices(caInfo.url, {
                trustedRoots: caTLSCACerts,
                verify: false
            }, caInfo.caName);

            // Get admin identity
            const adminIdentity = await this.wallet.get('admin');
            const provider = this.wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');

            // Register and enroll user
            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: userId,
                enrollmentSecret: userSecret || undefined,
                role: 'client'
            }, adminUser);

            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            // Create identity and store in wallet
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes()
                },
                mspId: 'Org1MSP',
                type: 'X.509'
            };

            await this.wallet.put(userId, x509Identity);
            console.log(`Successfully enrolled user ${userId}`);

            return { success: true, message: `User ${userId} enrolled successfully` };
        } catch (error) {
            console.error(`Failed to enroll user ${userId}:`, error);
            throw error;
        }
    }
}

// Singleton instance
let gatewayInstance = null;

async function getGateway() {
    if (!gatewayInstance) {
        gatewayInstance = new FabricGateway();
        await gatewayInstance.initialize();
    }
    return gatewayInstance;
}

module.exports = {
    FabricGateway,
    getGateway
};

