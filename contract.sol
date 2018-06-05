// Version of solidity compiler this program was written for
pragma solidity ^0.4.24;

contract KofNMultisig {
    
    // Conatants
    uint BLOCKS_TO_RESPOND = 20;
    uint BLOCKS_TO_BLOCK = 50;

    struct Challenge {
        bool isActive;
    	address sender;
    	address target;
    	uint startBlock;
    }
  
    struct Transaction {
        uint id;
        address receiver;	
        uint amountToTransfer;
        uint count;
        bool[] usersApproves;

    }  
    struct User {
    	address wallet;
    	bool inGroup;
    	bool challenged;
    	uint lastChallengeBlock;    // the last time this user published a challenge
    }
    
	uint K;
	mapping (address => User) usersInGroup;
	Challenge challenge;
	mapping (uint => Transaction) ledger;
	address penaltyWallet;
	
	uint constant penalty = 0.1 ether;  // should be total amount/K
	
	// Initiliaze KofNMultisig contract
    constructor(address[] wallets)
    public
    {
	    K = wallets.length;
	    for(uint i = 0; i <wallets.length ; i++) {
	        User memory user = User(wallets[i], true, false, 0);
            usersInGroup.push(user);
	    }
	    challenge = Challenge(false, 0, 0, 0);
	}
	
	// Create a new challenge and challenge the user with the address target
    function sendChallenge(address target)
	payable
	public
	{
	    require(challenge.isActive == false);
	    require(msg.value >= fee);
	    require(usersInGroup[target] != 0);    //same as: require(getUserIndexByAddress(target) != -1)
	    require(block.number - usersInGroup[msg.sender].lastChallengeBlock >= BLOCKS_TO_BLOCK);
	    
	    challenge = Challenge(true, msg.sender, target, block.number);
	    usersInGroup[msg.sender].lastChallengeBlock = block.number;
	    usersInGroup[target].challenged = true;
	}
	
	// Check if the function caller is the challenger’s target, answer the challenge if yes	
	// and take a fee from the contract wallet
	function respondToChallenge()
	public
	{
	    require(challenge.valid == true);
	    require(msg.sender == challenge.target);
	    require(usersInGroup[msg.sender].inGroup == true);
	
        usersInGroup[msg.sender].challenged = false;
        challenge.isActive = false;
        
        // Punish the whole group by taking the penalty
        penaltyWallet.transfer(penalty);

	}
	
	// called to trigger the removal of the user from the group in case times up
	function tryToRemoveChallengedUser()
	public
	{
	    if(block.number - challenge.startBlock > BLOCKS_TO_RESPOND) {
	        removeFromGroup(challenge.target);
	    }
	}
	
	function removeFromGroup(address userWallet)
	private
	{
	    require(K > 0);
	    require(usersInGroup[userWallet].inGroup == true);
	    
	    // remove the challenge target from group and remove the sender block
        usersInGroup[userWallet].inGroup = false;
        K--;
        usersInGroup[challenge.sender].lastChallengeBlock = 0;
        
        // if there are no more users in the group - transfer the contract balance to penaltyWallet
        if(K == 0)
        penaltyWallet.transfer(this.balance);
	}
	
	
	
	
	

	
	function getUserIndexByAddress(address _address)
	private
	constant
	returns (uint8 _i) {
	    for(uint8 i = 0; i < N; i++) {
            if(usersInGroup[i].wallet == _address)
                return i;
	    }
	    return -1;
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
      return (usersInGroup[i].wallet, users_in_group[i].in_group);
    }
    
}
