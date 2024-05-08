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
        // Accounts setup
        [buyer, seller, inspector, lender] = await ethers.getSigners();

        // Deploy RealEstate Contract
        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();

        // Mint a new token and capture the token ID
        const mintTx = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");
        const receipt = await mintTx.wait();
        tokenId = receipt.events[0].args.tokenId;

        // Deploy Escrow Contract
        const Escrow = await ethers.getContractFactory('Escrow');
        escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address);

        // Approve the Escrow contract to manage the minted token on behalf of the seller
        await realEstate.connect(seller).approve(escrow.address, tokenId);

        // List the property using the token ID
        await escrow.connect(seller).list(tokenId, buyer.address, tokens(90), tokens(18));
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
            const isListed = await escrow.isListed(1);
            expect(isListed).to.equal(true);
        });

        it('Returns buyer', async () => {
            const buyerAddress = await escrow.buyer(1);
            expect(buyerAddress).to.equal(buyer.address);
        });

        it('Returns purchase price', async () => {
            const purchasePrice = await escrow.purchasePrice(1);
            expect(purchasePrice).to.equal(tokens(90));
        });

        it('Returns escrow amount', async () => {
            const escrowAmount = await escrow.escrowAmount(1);
            expect(escrowAmount).to.equal(tokens(18));
        });

        it('Updates ownership', async () => {
            const owner = await realEstate.ownerOf(1);
            expect(owner).to.equal(escrow.address);
        });
    });

    describe('Deposits', () => {
        beforeEach(async () => {
            // Deposit earnest money that matches the escrow amount
            const depositTx = await escrow.connect(buyer).depositEarnest(1, { value: tokens(18) });
            await depositTx.wait();
        });

        it('Updates contract balance', async () => {
            const balance = await escrow.getBalance();
            expect(balance).to.be.equal(tokens(18));
        });
    });

    describe('Inspection', () => {
        beforeEach(async () => {
            // Update inspection status to passed
            const inspectionTx = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await inspectionTx.wait();
        });

        it('Updates inspection status', async () => {
            const inspectionStatus = await escrow.inspectionPassed(1);
            expect(inspectionStatus).to.be.equal(true);
        });
    });

    describe('Approval', () => {
        beforeEach(async () => {
            // Multiple approvals for the sale
            let approvalTx = await escrow.connect(buyer).approveSale(1);
            await approvalTx.wait();

            approvalTx = await escrow.connect(seller).approveSale(1);
            await approvalTx.wait();

            approvalTx = await escrow.connect(lender).approveSale(1);
            await approvalTx.wait();
        });

        it('Updates approval status', async () => {
            const buyerApproval = await escrow.approval(1, buyer.address);
            const sellerApproval = await escrow.approval(1, seller.address);
            const lenderApproval = await escrow.approval(1, lender.address);
            expect(buyerApproval).to.be.equal(true);
            expect(sellerApproval).to.be.equal(true);
            expect(lenderApproval).to.be.equal(true);
        });
    });

    describe('Sale', () => {
        beforeEach(async () => {
            // Complete the sale process with correct deposit amounts
            let saleTx = await escrow.connect(buyer).depositEarnest(1, { value: tokens(18) });
            await saleTx.wait();

            saleTx = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await saleTx.wait();

            saleTx = await escrow.connect(buyer).approveSale(1);
            await saleTx.wait();

            saleTx = await escrow.connect(seller).approveSale(1);
            await saleTx.wait();

            saleTx = await escrow.connect(lender).approveSale(1);
            await saleTx.wait();

            // Ensure the lender sends enough to cover the purchase price
            await lender.sendTransaction({ to: escrow.address, value: tokens(90) });

            saleTx = await escrow.connect(seller).finalizeSale(1);
            await saleTx.wait();
        });

        it('Updates ownership', async () => {
            const newOwner = await realEstate.ownerOf(1);
            expect(newOwner).to.be.equal(buyer.address);
        });

        it('Updates balance', async () => {
            const finalBalance = await escrow.getBalance();
            expect(finalBalance).to.be.equal(0);
        });
    });
});
