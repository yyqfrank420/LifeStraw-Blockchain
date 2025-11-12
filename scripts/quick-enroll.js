const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Wallet path
        const walletPath = path.join(__dirname, '../server/fabric/wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if appUser exists
        const userExists = await wallet.get('appUser');
        if (userExists) {
            console.log('appUser already exists in wallet');
            return;
        }

        // Get User1 credentials from Fabric test network
        const credPath = path.join(__dirname, '../fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com');
        const certificate = fs.readFileSync(path.join(credPath, 'msp/signcerts/cert.pem')).toString();
        const privateKey = fs.readFileSync(path.join(credPath, 'msp/keystore', fs.readdirSync(path.join(credPath, 'msp/keystore'))[0])).toString();

        // Create identity
        const identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        // Import to wallet
        await wallet.put('appUser', identity);
        console.log('✅ Successfully enrolled appUser');
        console.log('Wallet path:', walletPath);

    } catch (error) {
        console.error(`Failed to enroll user: ${error}`);
        process.exit(1);
    }
}

main();

