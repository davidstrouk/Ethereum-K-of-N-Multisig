// var MultisigWallet = artifacts.require("MultisigWallet");
var KofNMultisig = artifacts.require("KofNMultisig");

module.exports = function(deployer) {
    // deployer.deploy(MultisigWallet);

    const accounts = web3.eth.accounts;
    const user = accounts[0];

    deployer.deploy(KofNMultisig, ["0x655d70f5A540356453307f7e55584cDb6117aCe7", "0xe7326e1743C530cBB3FA7EFa27F6345C5Baf1582", "0x81BE0A9D2C6F7880643477207875b30dD2C514d4"]);
};
