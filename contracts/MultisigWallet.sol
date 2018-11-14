// Version of solidity compiler this program was written for
pragma solidity ^0.4.24;

import "./KofNMultisig.sol";

//-------------------------- MultisigWallet Contract --------------------------
contract MultisigWallet {

    event ContractCreated(address newAddress);

    mapping(address => address) public groups;

    //constructor()
    //public
    //{

    //}

    function addGroup(address[] wallets, uint k)
	public
	returns (address)
	{
	    KofNMultisig newContract = new KofNMultisig(wallets, k);
	    groups[msg.sender] = newContract;
	    return newContract;
	}

}
