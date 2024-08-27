const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgoraPass Contract", function () {

  let AgoraPass;
  let agorapass;
  let owner;
  let add1;
  let name;
  let symbol;
  let maxSupply;
  let priceBigNumber;

  beforeEach(async function () {

    name = "AgoraPass";
    symbol = "AGORAP";
    maxSupply = 10000;
    priceBigNumber = ethers.parseEther("0.5"); // Set mint price to 0.5 ETH

    const signers = await ethers.getSigners();
    owner = signers[0];
    add1 = signers[1];

    AgoraPass = await ethers.getContractFactory("AgoraPass"); 
    agorapass = await AgoraPass.deploy(name, symbol, maxSupply, priceBigNumber);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await agorapass.owner()).to.equal(owner.address);
    });

    it("Should set the right name and symbol", async function () {
      expect(await agorapass.name()).to.equal(name);
      expect(await agorapass.symbol()).to.equal(symbol);
    });

    it("Should set the correct max supply", async function () {
      expect(await agorapass.maxSupply()).to.equal(maxSupply);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens successfully", async function () {
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await expect(agorapass.mint(owner.address, 1, { value: priceBigNumber })).to.not.be.reverted;
      expect(await agorapass.totalSupply()).to.equal(1);

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.be.lt(ownerBalanceBefore); // Owner balance should decrease due to the gas cost
    });

    it("Should revert if the max supply is exceeded", async function () {
      await agorapass.mint(owner.address, maxSupply - 1, { value: priceBigNumber * ethers.toBigInt(maxSupply - 1) });
      expect(await agorapass.totalSupply()).to.equal(maxSupply - 1);

      await expect(
        agorapass.mint(owner.address, 2, { value: priceBigNumber * ethers.toBigInt(2) })
      ).to.be.revertedWith("Maximum supply reached");
    });

    it("Should refund excess ETH sent during minting", async function () {
      const excessPayment = ethers.parseEther("1");
      const balanceBefore = await ethers.provider.getBalance(add1.address);

      await agorapass.connect(add1).mint(add1.address, 1, { value: excessPayment });

      const balanceAfter = await ethers.provider.getBalance(add1.address);
      expect(balanceAfter).to.be.closeTo(balanceBefore - priceBigNumber, ethers.parseEther("0.01")); // Allow some deviation for gas costs
    });
  });

  describe("Admin Minting", function () {
    it("Should allow the owner to mint tokens without payment", async function () {
      await agorapass.adminMint(owner.address, 1);
      expect(await agorapass.totalSupply()).to.equal(1);
    });

    it("Should revert if the admin mint exceeds max supply", async function () {
      await agorapass.adminMint(owner.address, maxSupply - 1);
      expect(await agorapass.totalSupply()).to.equal(maxSupply - 1);

      await expect(
        agorapass.adminMint(owner.address, 2)
      ).to.be.revertedWith("Maximum supply reached");
    });
  });

  describe("Set Price", function () {
    it("Should allow the owner to set a new price", async function () {
      const newPrice = ethers.parseEther("1");
      await agorapass.setPrice(newPrice);
      expect(await agorapass.price()).to.equal(newPrice);
    });

    it("Should revert if a non-owner tries to set the price", async function () {
      const newPrice = ethers.parseEther("1");
      await expect(agorapass.connect(add1).setPrice(newPrice))
      .to.be.revertedWithCustomError(agorapass, "OwnableUnauthorizedAccount");
    });
  });

  describe("Base URI", function () {
    it("Should allow the owner to set the base URI", async function () {
      const newBaseURI = "https://newbaseuri.com/";
      await agorapass.setBaseURI(newBaseURI);
      expect(await agorapass._baseTokenURI()).to.equal(newBaseURI);
    });

    it("Should return the correct base URI after setting", async function () {
      const newBaseURI = "https://newbaseuri.com/";
      await agorapass.setBaseURI(newBaseURI);
      expect(await agorapass._baseTokenURI()).to.equal(newBaseURI);
    });
  });

  describe("Withdraw", function () {
    it("Should allow the owner to withdraw funds", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      // Mint to generate funds
      await agorapass.mint(owner.address, 1, { value: priceBigNumber });
      const balanceAfter = await ethers.provider.getBalance(agorapass.target);
      expect(balanceAfter).to.be.eq(priceBigNumber); 

      await agorapass.withdraw();
      expect(await ethers.provider.getBalance(agorapass.target)).to.be.eq(ethers.parseEther("0")); // Balance should increase after withdrawal

    });

    it("Should revert if a non-owner tries to withdraw funds", async function () {
      await expect(agorapass.connect(add1).withdraw()).to.be.revertedWithCustomError(agorapass, "OwnableUnauthorizedAccount");
    });
  });
});
