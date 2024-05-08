const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Escrow", () => {
    let buyer, seller, inspector, lender;
    let realEstate, escrow;
    
    it('Saves the addresses', async () => {
        
        [buyer, seller, inspector, lender] = await ethers.getSigners();
        console.log(buyer, seller);
        let realEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await realEstate.deploy()

       
    })
})