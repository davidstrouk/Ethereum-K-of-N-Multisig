// var MultisigWallet = artifacts.require("MultisigWallet");
var KofNMultisig = artifacts.require("KofNMultisig");

module.exports = function(deployer) {
    // deployer.deploy(MultisigWallet);

    const accounts = web3.eth.accounts;
    const user = accounts[0];

<<<<<<< HEAD
    deployer.deploy(KofNMultisig, ["0x043e0af8a0aBe779b18c8E40d301aF590b3ecD90", "0x11D1aC7078b44fFd61693806c7B6f91984e250C0"]);
=======
    deployer.deploy(KofNMultisig, ["0x655d70f5A540356453307f7e55584cDb6117aCe7", "0xe7326e1743C530cBB3FA7EFa27F6345C5Baf1582"]);
>>>>>>> eafa55ed74beb47aa63ff00c8a59eefc62119f82
};
