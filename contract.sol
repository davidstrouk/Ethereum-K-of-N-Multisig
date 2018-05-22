// Version of solidity compiler this program was written for
pragma solidity ^0.4.24;

contract KofNMultisig {

    struct Challenge {
        bool valid;
    	address sender;
    	address target;
    	uint start_block;
    }
    
    struct User {
    	address wallet;
    	bool in_group;
    	bool challenged;
    }
    
	uint8 N;
	uint8 K;
	User[] usersGroup;
	Challenge challenge;
	uint constant fee = 0.1 ether;
	
//	bytes32 constant message = "You got a challenge";
	
	// Initiliaze KofNMultisig contract
    constructor(uint8 _N, address[] wallets)
    public
    {
	    N = _N;
	    K = _N;
	    for(uint8 i = 0; i < _N; i++) {
	        User memory user = User(wallets[i], true, false);
            usersGroup.push(user);
	    }
	    challenge = Challenge(false, 0, 0, 0);
	}
	
	function removeFromGroup(uint8 i)
	public
	{
	    require(K>0 && usersGroup[i].in_group == true);
    
        usersGroup[i].in_group = false;
        K--;
	}
	
	function sendChallenge(address _target)
	payable
	public
	{
	    require(challenge.valid == false);
	    require(msg.value >= fee);
	    
	    challenge = Challenge(true, msg.sender, _target, block.number);
	    uint8 indexOfChallengedUser = getUserIndexByAddress(_target);
	    usersGroup[indexOfChallengedUser].challenged = true;
	    
	}
	
	function respondToChallenge()
	public
	{
	    require(challenge.valid == true);
	    require(msg.sender == challenge.target);
	    
	    // should only remove the flags because if timestamp passed - should not enter to this function
        uint8 indexOfChallengedUser = getUserIndexByAddress(challenge.target);
        usersGroup[indexOfChallengedUser].challenged = false;
        challenge.valid = false;
        
        assert(address(this).balance >= fee);
        challenge.target.transfer(fee);
	}
	
	function getUserIndexByAddress(address _address)
	private
	constant
	returns (uint8 _i) {
	    for(uint8 i = 0; i < N; i++) {
            if(usersGroup[i].wallet == _address)
                return i;
	    }
	    return N;
	}
	
	function getN() 
	public 
	constant 
	returns (uint8 _N) 
	{
	    return N;
	}
	
	function getK()
	public 
	constant 
	returns (uint8 _K)
	{
	    return K;
	}
	
	function getUser(uint8 i)
	public
	constant
	returns (address wallet, bool in_group)
	{
      return (usersGroup[i].wallet, usersGroup[i].in_group);
    }
    
}
