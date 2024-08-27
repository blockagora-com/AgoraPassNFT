const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgoraPass", function () {

  let AgoraPass;
  let agorapass;
  let owner;
  let add1;
  let name;
  let symbol;
  let MockUSDT;
  let mockUSDT;
  let price;
  let priceBigNumber;


  beforeEach(async function () {

    name = "AgoraPass"
    symbol = "AGORAP"
    maxSupply = 10000
    priceBigNumber = ethers.parseEther("0.5"); // Set mint price to 0.5 ETH

    const signers = await ethers.getSigners();
    owner = signers[0];
    add1 = signers[1];

    AgoraPass = await ethers.getContractFactory("AgoraPass"); 
    agorapass = await AgoraPass.deploy(name, symbol, maxSupply, priceBigNumber);
    
  });

  describe("Basic Checks", function () {

    it("check owner, name, etc.", async function () {
      expect(await agorapass.owner()).to.equal(owner.address);
      expect(await agorapass.name()).to.equal(name);
      expect(await agorapass.symbol()).to.equal(symbol);
      expect(await agorapass.maxSupply()).to.equal(maxSupply);


    });

    it("mint", async function () {
      // Check minting
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await expect(agorapass.mint(owner.address, 1, { value: priceBigNumber })).to.not.be.reverted;
      expect(await agorapass.totalSupply()).to.equal(1);

      // Check payment
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.be.lt(ownerBalanceBefore); // The balance should have increased
      
      // Check max supply
      await agorapass.mint(owner.address, maxSupply - 1, { value: priceBigNumber * ethers.toBigInt(maxSupply - 1) });
      expect(await agorapass.totalSupply()).to.equal(maxSupply);
      
      // Check max supply exceeded
      await expect(
        agorapass.mint(owner.address, 2, { value: priceBigNumber* ethers.toBigInt(2) })
      ).to.be.revertedWith("Maximum supply reached");
    });

    it("admin mint", async function () {  
      // check maxSupply
      await agorapass.adminMint(owner.address, 1);
      expect(await agorapass.totalSupply()).to.equal(1);
      await expect(
        agorapass.adminMint(owner.address, maxSupply)
      ).to.be.revertedWith("Maximum supply reached");

      //check batch mint
      await agorapass.adminMint(owner.address, maxSupply - 1);
      expect(await agorapass.totalSupply()).to.equal(maxSupply);

      
    });
  })
});
