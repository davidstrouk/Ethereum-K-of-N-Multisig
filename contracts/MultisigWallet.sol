// Version of solidity compiler this program was written for
pragma solidity ^0.4.24;

import "./KofNMultisig.sol";

//-------------------------- MultisigWallet Contract --------------------------
/**
@author Shoval Loolian, David Strouk
@notice Create new shared wallets.
*/
contract MultisigWallet {

    event ContractCreated(address newAddress);

    mapping(address => address) public groups;

  	/**
	@notice Initialize MultisigWallet contract
	*/
	constructor()
	public
	{

	}

	/**
	@notice Create new shared wallet of type "KofNMultisig" between N users.
	@param wallets The wallets addresses of the N users
	@param K The size of required approvals
	@return The address of the new shared wallet contract
	  */
  function addGroup(address[] wallets, uint K)
	public
	returns (address)
	{
	    KofNMultisig newContract = new KofNMultisig(wallets, K);
	    groups[msg.sender] = newContract;
	    emit ContractCreated(newContract);
	    return newContract;
	}

}
