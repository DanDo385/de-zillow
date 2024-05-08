// Escrow.test.js

const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe("Escrow", () => {
    let buyer, seller, inspector, lender;
    let realEstate, escrow;
    let tokenId; // To hold the minted token ID

    beforeEach(async () => {
        // Accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners();

        // Deploy RealEstate Contract
        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();

        // Mint a new token and capture the token ID
        const mintTx = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");
        const receipt = await mintTx.wait();
        tokenId = receipt.events[0].args.tokenId;  // Assuming the tokenId is emitted in the first event

        // Deploy Escrow Contract
        const Escrow = await ethers.getContractFactory('Escrow');
        escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address);

        // Approve the Escrow contract to manage the minted token on behalf of seller
        await realEstate.connect(seller).approve(escrow.address, tokenId);

        // List the property using the token ID
        await escrow.connect(seller).list(tokenId, buyer.address, tokens(10), tokens(5));
    });

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress();
            expect(result).to.equal(realEstate.address);
        });

        it('Returns seller', async () => {
            const result = await escrow.seller();
            expect(result).to.equal(seller.address);
        });

        it('Returns inspector', async () => {
            const result = await escrow.inspector();
            expect(result).to.equal(inspector.address);
        });

        it('Returns lender', async () => {
            const result = await escrow.lender();
            expect(result).to.equal(lender.address);
        });
    });

    describe('Listing', () => {
        it('Updates as listed', async () => {
            const result = await escrow.isListed(1);
            expect(result).to.equal(true);
        });

        it('Returns buyer', async () => {
            const result = await escrow.buyer(1);
            expect(result).to.equal(buyer.address);
        });

        it('Returns purchase price', async () => {
            const result = await escrow.purchasePrice(1);
            expect(result).to.equal(tokens(10));
        });

        it('Returns escrow amount', async () => {
            const result = await escrow.escrowAmount(1);
            expect(result).to.equal(tokens(5));
        });

        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.equal(escrow.address);
        });
    });
});  // This closing bracket ends the outermost describe block
