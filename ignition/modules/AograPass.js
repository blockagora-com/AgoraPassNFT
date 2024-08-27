const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AgoraPass", (m) => {
    const proxyAdminOwner = m.getAccount(0);
    console.log(proxyAdminOwner)
    // Deploy the AgoraPass contract as an upgradeable proxy
    const agorapass = m.contract("AgoraPass", [], { proxy: true });

    // Initialize the contract with parameters
    m.call(agorapass, "initialize", ["AgoraPass", "AGORAP", proxyAdminOwner]);
    m.call(agorapass, "mint", [proxyAdminOwner, 1]);


  return { agorapass };
});