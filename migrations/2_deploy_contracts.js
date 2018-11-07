// var MultisigWallet = artifacts.require("MultisigWallet");
var KofNMultisig = artifacts.require("KofNMultisig");

module.exports = function(deployer) {
    // deployer.deploy(MultisigWallet);

    const accounts = web3.eth.accounts;
    const user = accounts[0];

    deployer.deploy(KofNMultisig, ["0x043e0af8a0aBe779b18c8E40d301aF590b3ecD90", "0x11D1aC7078b44fFd61693806c7B6f91984e250C0"]);
};
