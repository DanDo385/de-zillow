// Import the Hardhat Runtime Environment
const hre = require("hardhat");

// Helper function to convert tokens into the smallest unit (e.g., ether to wei)
const tokens = (n) => ethers.utils.parseUnits(n.toString(), 'ether');

async function main() {
    // Deploy contracts and mint properties using Hardhat network signers
    const [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy the Real Estate contract
    const RealEstate = await ethers.getContractFactory('RealEstate');
    const realEstate = await RealEstate.deploy();
    await realEstate.deployed();
    console.log(`Deployed Real Estate Contract at: ${realEstate.address}`);
    
    // Mint 3 properties with unique metadata URLs
    console.log(`Minting 3 properties...`);
    for (let i = 1; i <= 3; i++) {
        const tx = await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i}.json`);
        await tx.wait();
    }

    // Deploy the Escrow contract
    const Escrow = await ethers.getContractFactory('Escrow');
    const escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address);
    await escrow.deployed();
    console.log(`Deployed Escrow Contract at: ${escrow.address}`);

    // Approve and list all 3 properties in the escrow contract
    console.log(`Listing 3 properties...`);
    for (let i = 1; i <= 3; i++) {
        const approveTx = await realEstate.connect(seller).approve(escrow.address, i);
        await approveTx.wait();

        const listTx = await escrow.connect(seller).list(i, buyer.address, tokens(20 - (i - 1) * 5), tokens(10 - (i - 1) * 5));
        await listTx.wait();
    }

    console.log(`Finished deploying and listing properties.`);
}

// Entry point to handle errors and run the main function
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
