require("@nomicfoundation/hardhat-toolbox");
// require('@nomiclabs/hardhat-ethers');
require("@nomicfoundation/hardhat-ethers");
// require('@nomiclabs/hardhat-etherscan');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    dev: { url: 'http://localhost:8545' },
  },
  mocha: {
    timeout: 10000
  },
  etherscan: {
    // Your Etherscan API key for contract verification (optional)
    apiKey: ""
  }
};