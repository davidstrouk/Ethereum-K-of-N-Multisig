pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
// import "../contracts/MultisigWallet.sol";
import "../contracts/KofNMultisig.sol";

contract TestKofN {
	// function testBasic() public {
	// 	Assert.equal(uint(1), uint(1), "true");
	// 	// Assert.equal(uint(2), uint(1), "wrong");
	// }

	// function testAddGroup() public {a
	// 	MultisigWallet ms = new MultisigWallet();
	// 	address[] storage wallets;
	// 	wallets.push(0x56C509F889a8B6950a77d0E4D8a252D2a805A74d);
	// 	wallets.push(0xdE9d4F3c10a5242EB8885502a609dfCa33ce5fdF);
	// 	address newContractAddress = ms.addGroup(wallets);
	// 	KofNMultisig newContract = KofNMultisig(newContractAddress);
	// 	address(newContract).transfer(1 ether);
	// 	Assert.equal(address(newContract).balance, uint(1 ether), "OK");
	// 	//KofNMultisig newContract = new KofNMultisig(["0x56C509F889a8B6950a77d0E4D8a252D2a805A74d","0xdE9d4F3c10a5242EB8885502a609dfCa33ce5fdF"]);

	// }

<<<<<<< HEAD
	address user1 = 0x043e0af8a0aBe779b18c8E40d301aF590b3ecD90;
	address user2 = 0x11D1aC7078b44fFd61693806c7B6f91984e250C0;
=======
	address user1 = 0x655d70f5A540356453307f7e55584cDb6117aCe7;
	address user2 = 0xe7326e1743C530cBB3FA7EFa27F6345C5Baf1582;
>>>>>>> eafa55ed74beb47aa63ff00c8a59eefc62119f82
	uint constant SIZE = 2;

	function testConstructor() public {

		KofNMultisig newContract = KofNMultisig(DeployedAddresses.KofNMultisig());

		address[SIZE] memory wallets;
		wallets[0] = user1;
		wallets[1] = user2;

		// TESTS
		Assert.equal(newContract.getK(), wallets.length, "Wrong K");
		for(uint i = 0; i < wallets.length; i++) {
			Assert.equal(newContract.getUserWallet(wallets[i]), wallets[i], "Wrong userWallet");
			Assert.equal(newContract.getUserInGroup(wallets[i]), true, "Wrong userInGroup");
			Assert.equal(newContract.getUserChallenged(wallets[i]), false, "Wrong userChallenged");
			Assert.equal(newContract.getUserLastChallengeBlock(wallets[i]), 0, "Wrong userLastChallengeBlock");
		}
		Assert.equal(newContract.getChallengeIsActive(), false, "Wrong challengeIsActive");
		Assert.equal(newContract.getChallengeSender(), 0, "Wrong challengeSender");
		Assert.equal(newContract.getChallengeTarget(), 0, "Wrong challengeTarget");
		Assert.equal(newContract.getChallengeStartBlock(), 0, "Wrong challengeStartBlock");

		Assert.equal(newContract.getNumberOfTransactions(), 0, "Wrong numberOfTransactions");
	}

	function testSendChallenge() public {

		KofNMultisig newContract = KofNMultisig(DeployedAddresses.KofNMultisig());

		// Test Require #1
   		ThrowProxy throwproxy = new ThrowProxy(address(newContract));
   		KofNMultisig(address(throwproxy)).sendChallenge(user1);
    	bool r = throwproxy.execute.gas(200000)();
    	Assert.isFalse(r, "Should be false because is should throw!");

		// Test Require #2
	}

	function print(address add) public returns (address) {
  		return add;
  	}
}

// Proxy contract for testing throws
contract ThrowProxy {
  address public target;
  bytes data;

  constructor(address _target) public {
    target = _target;
  }

  //prime the data using the fallback function.
  function() public {
    data = msg.data;
  }

  function execute() public returns (bool) {
    return target.call(data);
  }
}
