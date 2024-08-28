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
    priceBigNumber = ethers.parseEther("0.001"); // Set mint price to 0.001 ETH

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
    it("Should mint tokens when totalSupply is less than roundTokenNum", async function () {
      await agorapass.setRoundTokenNum(10)

      await agorapass.mint(add1.address, 5, { value: ethers.parseEther("5") });
      expect(await agorapass.totalSupply()).to.equal(5);
      await agorapass.mint(add1.address, 3, { value: ethers.parseEther("3") });
      expect(await agorapass.totalSupply()).to.equal(8);
    });

    it("Should revert if minting would exceed roundTokenNum", async function () {
      await agorapass.setRoundTokenNum(10)

      await agorapass.mint(add1.address, 10, { value: ethers.parseEther("10") });
      expect(await agorapass.totalSupply()).to.equal(10);
  
      await expect(agorapass.mint(add1.address, 1, { value: ethers.parseEther("1") }))
          .to.be.revertedWith("Quantity exceeds round token limit");
    });

    it("Should mint tokens successfully", async function () {
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await expect(agorapass.mint(owner.address, 1, { value: priceBigNumber })).to.be.revertedWith("Quantity exceeds round token limit");

      await agorapass.setRoundTokenNum(10000)

      await expect(agorapass.mint(owner.address, 1, { value: priceBigNumber })).to.not.be.reverted;
      expect(await agorapass.totalSupply()).to.equal(1);

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.be.lt(ownerBalanceBefore); // Owner balance should decrease due to the gas cost
    });

    it("Should revert if the max supply is exceeded", async function () {
      await agorapass.setRoundTokenNum(10000)

      await agorapass.mint(owner.address, maxSupply - 1, { value: priceBigNumber * ethers.toBigInt(maxSupply - 1) });
      expect(await agorapass.totalSupply()).to.equal(maxSupply - 1);

      await expect(
        agorapass.mint(owner.address, 2, { value: priceBigNumber * ethers.toBigInt(2) })
      ).to.be.revertedWith("Maximum supply reached");
    });

    it("Should refund excess ETH sent during minting", async function () {
      await agorapass.setRoundTokenNum(10000)

      const excessPayment = ethers.parseEther("1");
      const balanceBefore = await ethers.provider.getBalance(add1.address);

      await agorapass.connect(add1).mint(add1.address, 1, { value: excessPayment });

      const balanceAfter = await ethers.provider.getBalance(add1.address);
      expect(balanceAfter).to.be.closeTo(balanceBefore - priceBigNumber, ethers.parseEther("0.01")); // Allow some deviation for gas costs
    });
  });


  describe("Tokenuri Tests", async function () {

    it("Should return the correct tokenURI when baseURI is set", async function () {
        await agorapass.setRoundTokenNum(10000)

        await agorapass.setBaseURI("https://example.com/metadata/");
        await agorapass.mint(owner.address, 5, { value: priceBigNumber * ethers.toBigInt(5) })

        const tokenURI = await agorapass.tokenURI(0);
        expect(tokenURI).to.equal("https://example.com/metadata/0");

        const tokenURI3 = await agorapass.tokenURI(3);
        expect(tokenURI3).to.equal("https://example.com/metadata/3");
    });

    it("Should revert when querying tokenURI for a non-existent token", async function () {
        await agorapass.setRoundTokenNum(10000)
        await expect(agorapass.tokenURI(9999)).to.be.revertedWithCustomError(agorapass, "URIQueryForNonexistentToken");
    });
  })

  describe("CheckSupply Tests", async function () {
    it("Should allow minting within maxSupply", async function () {
        await agorapass.setRoundTokenNum(10000)

        await agorapass.mint(add1.address, 5000, { value: ethers.parseEther("50") });

        await agorapass.mint(add1.address, 5000, { value: ethers.parseEther("50") });
        expect(await agorapass.totalSupply()).to.equal(10000);
    });

    it("Should revert minting that exceeds maxSupply", async function () {
        await agorapass.setRoundTokenNum(10000)

        await agorapass.mint(add1.address, 10000, { value: ethers.parseEther("50") });
        expect(await agorapass.totalSupply()).to.equal(10000);

        await expect(agorapass.mint(add1.address, 6, { value: ethers.parseEther("50") }))
            .to.be.revertedWith("Maximum supply reached");
    });
  })

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
      agorapass.setRoundTokenNum(10000)

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
