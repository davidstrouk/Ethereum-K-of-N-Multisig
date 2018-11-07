// Version of solidity compiler this program was written for
pragma solidity ^0.4.24;

//-------------------------- KofNMultisig Contract --------------------------
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
        //bool[] usersApproves;
        mapping (address => bool) usersApproves;

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
	uint numberOfTransactions;

	uint constant penalty = 0.1 ether;  // should be total amount/K

	// Initiliaze KofNMultisig contract
    constructor(address[] wallets)
    public
    {
        require(wallets.length > 0,
          "There are no members in the group");
	    K = wallets.length;
	    for(uint i = 0; i < wallets.length ; i++) {
            usersInGroup[wallets[i]] = User(wallets[i], true, false, 0);
	    }
	    challenge = Challenge(false, 0, 0, 0);
	    penaltyWallet = 0x56C509F889a8B6950a77d0E4D8a252D2a805A74d;   // TBD
	    numberOfTransactions = 0;
	}

	// Create a new challenge and challenge the user with the address target
    function sendChallenge(address target)
	payable
	public
	{
		  require(usersInGroup[msg.sender].wallet != 0,
        "You dont belong to the group");    //same as: require(getUserIndexByAddress(target) != -1)
	    require(challenge.isActive == false,
        "There is already a published challenge");
	    require(msg.value >= penalty,
        "You dont have enough money to pay the penalty");
	    require(usersInGroup[target].wallet != 0,
        "Your target doesnt belong to the group");    //same as: require(getUserIndexByAddress(target) != -1)
	    require(usersInGroup[msg.sender].lastChallengeBlock == 0
        || block.number - usersInGroup[msg.sender].lastChallengeBlock >= BLOCKS_TO_BLOCK,
        "You are blocked from sending a challenge. please wait");

	    challenge = Challenge(true, msg.sender, target, block.number);
	    usersInGroup[msg.sender].lastChallengeBlock = block.number;
	    usersInGroup[target].challenged = true;
	}

	// Check if the function caller is the challenger’s target, answer the challenge if yes
	// and take a fee from the contract wallet
	function respondToChallenge()
	public
	{
	    require(challenge.isActive == true,
        "There is no challenge");
	    require(msg.sender == challenge.target,
        "You are not the target of the challenge. You cant respond to it");
	    require(usersInGroup[msg.sender].inGroup == true,
        "You waited too long to respond. Sorry :(");

        usersInGroup[msg.sender].challenged = false;
        challenge.isActive = false;

        // Punish the whole group by taking the penalty
        penaltyWallet.transfer(penalty);

	}

	// Called to trigger the removal of the user from the group in case times up
	function tryToRemoveChallengedUser()
	public
	{
	    require(challenge.isActive == true,
        "There is no challenge");
	    require(usersInGroup[challenge.target].inGroup == true,
        "The user was already removed from the group");
	    if(block.number - challenge.startBlock > BLOCKS_TO_RESPOND) {
	        _removeFromGroup(challenge.target);
	    }
	}

	// Removes the user from group, called only when challenge’s times up
	function _removeFromGroup(address userWallet)
	private
	{
	    assert(K > 0);

	    // remove the challenge target from group and remove the sender block
        usersInGroup[userWallet].inGroup = false;
        K--;
        usersInGroup[challenge.sender].lastChallengeBlock = 0;

        // if there are no more users in the group - transfer the contract balance to penaltyWallet
        if(K == 0)
        penaltyWallet.transfer(address(this).balance);
	}


	// indicates the consent of msg.sender to transfer “amount” to address “to”
	function requestPayment(uint amount, address to)
	public
	{
	    require(usersInGroup[msg.sender].inGroup == true,
        "You dont belong to the group");
	    require(amount > 0,
        "Please ask for a possitive amount");

        ledger[numberOfTransactions] = Transaction(numberOfTransactions, to, amount, 1);
        ledger[numberOfTransactions].usersApproves[msg.sender] = true;
        numberOfTransactions++;

	}

    // indicates the msg.sender approve for transaction with the id txid
    function approvePayment(uint txId)
    public
    {
        require(usersInGroup[msg.sender].inGroup == true,
          "You dont belong to the group");

        Transaction storage transaction = ledger[txId];
        if(transaction.usersApproves[msg.sender] == false)  // check if condition is valid
        {
            transaction.usersApproves[msg.sender] = true;
            transaction.count++;
            if(transaction.count == K)
            {
                //ledger[txId] = Transaction(0, 0, 0, 0);
                _makePayment(transaction.amountToTransfer, transaction.receiver);
            }
        }
    }

    // Initiates the transfer, called only when all K users gave their “permission”
    function _makePayment (uint amount, address to)
    private
    {
        to.transfer(amount);
    }

    function()
    public
    payable
    {}

    //-------------------------- KofNMultisig TEST FUNCTIONS -------------------

    function getK()
    public
    view
    returns (uint)
    {
    	return K;
    }

    function getUserWallet(address userAddress)
    public
    view
    returns (address)
    {
    	return usersInGroup[userAddress].wallet;
    }

    function getUserInGroup(address userAddress)
    public
    view
    returns (bool)
    {
    	return usersInGroup[userAddress].inGroup;
    }

    function getUserChallenged(address userAddress)
    public
    view
    returns (bool)
    {
    	return usersInGroup[userAddress].challenged;
    }

    function getUserLastChallengeBlock(address userAddress)
    public
    view
    returns (uint)
    {
    	return usersInGroup[userAddress].lastChallengeBlock;
    }

    function getChallengeIsActive()
    public
    view
    returns (bool)
    {
    	return challenge.isActive;
    }

    function getChallengeSender()
    public
    view
    returns (address)
    {
    	return challenge.sender;
    }

    function getChallengeTarget()
    public
    view
    returns (address)
    {
    	return challenge.target;
    }

    function getChallengeStartBlock()
    public
    view
    returns (uint)
    {
    	return challenge.startBlock;
    }

    function getTransactionId(uint txId)
    public
    view
    returns (uint)
    {
    	return ledger[txId].id;
    }

    function getTransactionReceiver(uint txId)
    public
    view
    returns (address)
    {
    	return ledger[txId].receiver;
    }

    function getTransactionAmountToTransfer(uint txId)
    public
    view
    returns (uint)
    {
    	return ledger[txId].amountToTransfer;
    }

    function getTransactionCount(uint txId)
    public
    view
    returns (uint)
    {
    	return ledger[txId].count;
    }

    function getTransactionUsersApprove(uint txId, address userAddress)
    public
    view
    returns (bool)
    {
    	return ledger[txId].usersApproves[userAddress];
    }

    function getPenaltyWallet()
    public
    view
    returns (address)
    {
    	return penaltyWallet;
    }

    function getNumberOfTransactions()
    public
    view
    returns (uint)
    {
    	return numberOfTransactions;
    }
}
