const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Escrow", () => {
    it('Saves the addresses', async () => {
        const realEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await realEstate.deploy()

       
    })
})