const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Escrow", () => {
    let buyer, seller, inspector, lender;
    let realEstate, escrow;

    beforeEach(async() => {
        // Accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners();
        
        // Deploy RealEstate Contract
        let RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await realEstate.deploy()

        // Mint
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");
        await transaction.wait();

        // Deploy Escrow Conmtra
        let Escrow = await ethers.getContractFactory('Escrow');
        escrow = await escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address);

        // List Property
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
        
        // Property Approval
        transaction = await RealEstate.connect(seller).approve(escrow.address, 1);
        await transaction.wait();
    })
        
    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            let result = await escrow.nftAddress();
            expect(result).to.be.equal(realEstate.address);
        })
    })
        
        
       