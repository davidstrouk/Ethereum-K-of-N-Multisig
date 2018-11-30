// Version of solidity compiler this program was written for
pragma solidity ^0.5.0;

import "./KofNMultisig.sol";

//-------------------------- MultisigWallet Contract --------------------------
/**
@author Shoval Loolian, David Strouk
@notice Create new shared wallets.
*/
contract MultisigWallet {

   /* event ContractCreated(address newAddress); */

  mapping(address => KofNMultisig) public groups;

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
  @param k The size of required approvals
  @return The address of the new shared wallet contract
  */
  function addGroup(address[] memory wallets, uint k)
	public
	returns (KofNMultisig)
	{
	    KofNMultisig newContract = new KofNMultisig(wallets, k);
	    groups[msg.sender] = newContract;
	    return newContract;
	}

}
