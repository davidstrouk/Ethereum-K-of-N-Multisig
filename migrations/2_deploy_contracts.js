// var MultisigWallet = artifacts.require("MultisigWallet");
var KofNMultisig = artifacts.require("KofNMultisig");

module.exports = function(deployer) {
    // deployer.deploy(MultisigWallet);

    const accounts = web3.eth.accounts;
    const user = accounts[0];

    deployer.deploy(KofNMultisig, [0x56C509F889a8B6950a77d0E4D8a252D2a805A74d, 0xdE9d4F3c10a5242EB8885502a609dfCa33ce5fdF]);
};