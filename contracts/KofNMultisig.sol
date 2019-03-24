// Version of solidity compiler this program was written for
pragma solidity ^0.4.24;

//-------------------------- KofNMultisig Contract --------------------------
/**
@author Shoval Loolian, David Strouk
@notice Shared wallet of N people which requests the approval of K members for making a payment.
*/
contract KofNMultisig {

    // Constants
    uint constant BLOCKS_TO_RESPOND = 10;
    uint constant BLOCKS_TO_BLOCK = 20;
    address constant penaltyWallet = 0x56C509F889a8B6950a77d0E4D8a252D2a805A74d;   // TBD

    event ChallengeSent(address target);
    event ChallengeResponded();
    event UserRemoved(address removed_user, uint K, uint N);
    event UserNotRemoved(address not_removed_user);
    event PaymentRequested(uint amount_to_transfer, address receiver, uint txId);
    event PaymentApproved(uint txId);
    event PaymentTransferred(uint txId);

    struct Challenge {
        bool isActive;
        address sender;
        address target;
        uint startBlock;
    }

    struct Transaction {
        address receiver;
        uint amountToTransfer;
        uint count;
        mapping (address => bool) usersApproves;
        bool transferred;
    }

    struct User {
        address wallet;
        bool inGroup;
        bool challenged;
        uint lastChallengeBlock;    // the last time this user published a challenge
    }

    uint N;
	uint K;

    address[] usersWallets;
	mapping (address => User) usersInGroup;
	Challenge challenge;
	mapping (uint => Transaction) ledger;
	uint numberOfTransactions;

    uint penalty;  // should be total amount/N

    /**
    @notice Initialize KofNMultisig contract with N wallets and K approvals
    @param wallets The wallets addresses of the N users
    @param _K The size of required approvals
    */
    constructor(address[] wallets, uint _K)
    public
    {
        require(wallets.length > 0, "There are no members in the group");
        require(_K > 0 && _K <= wallets.length, "K must be between 1 to N");
        N = wallets.length;
        K = _K;
        for(uint i = 0; i < wallets.length ; i++) {
            usersInGroup[wallets[i]] = User(wallets[i], true, false, 0);
        }
        usersWallets = wallets;
	    challenge = Challenge(false, 0, 0, 0);
	    numberOfTransactions = 0;
        penalty = 0;
	}

    /**
    @notice Sends a challenge to a member of the group to check whether its belonging to the group is still relevant. Along with calling this function a fee is needed.
    @param target The wallet address of the challenged user
    */
    function sendChallenge(address target)
    // Create a new challenge and challenge the user with the address target
	payable
	public
	{
	    require(usersInGroup[msg.sender].inGroup == true, "You dont belong to the group");
	    require(challenge.isActive == false, "There is already a published challenge");
	    require(msg.value >= penalty/2, "You dont have enough money to pay the penalty");
	    require(usersInGroup[target].inGroup == true, "Your target doesnt belong to the group");
	    require(usersInGroup[msg.sender].lastChallengeBlock == 0 || block.number - usersInGroup[msg.sender].lastChallengeBlock >= BLOCKS_TO_BLOCK, "You are blocked from sending a challenge. Please wait");

	    challenge = Challenge(true, msg.sender, target, block.number);
	    usersInGroup[msg.sender].lastChallengeBlock = block.number;
	    usersInGroup[target].challenged = true;

        emit ChallengeSent(target);
	}

    /**
    @notice Respond to the published challenge. Collect from shared wallet an amount of penalty
    */
	function respondToChallenge()
    // Check if the function caller is the challenger’s target, answer the challenge if yes
	// and take a fee from the contract wallet
	public
	{
        require(usersInGroup[msg.sender].inGroup == true, "You dont belong to the group");
        require(challenge.isActive == true, "There is no active challenge");
        require(msg.sender == challenge.target, "You are not the target of the challenge. You cant respond to it");

        usersInGroup[msg.sender].challenged = false;
        challenge.isActive = false;

        // Punish the whole group by taking the penalty
        penaltyWallet.transfer(penalty);

        emit ChallengeResponded();
	}

    /**
    @notice Try to remove the challenged user. If the challenged user has not answered after a certain amount of blocks (BLOCKS_TO_RESPOND), then he will be removed from group.
    */
	function tryToRemoveChallengedUser()
    // Called to trigger the removal of the user from the group in case times up
	public
	{
      require(usersInGroup[msg.sender].inGroup == true, "You dont belong to the group");
	    require(challenge.isActive == true, "There is no challenge");
	    require(usersInGroup[challenge.target].inGroup == true, "The user was already removed from the group");
	    if(block.number - challenge.startBlock > BLOCKS_TO_RESPOND) {
	        _removeFromGroup(challenge.target);
            challenge.isActive = false;
	    } else {
            emit UserNotRemoved(challenge.target);
        }
	}

    /**
    @notice Remove user from group
    @dev Private function. The user is removed from group.
    */
	function _removeFromGroup(address userWallet)
    // Removes the user from group, called only when challenge’s times up
	private
	{
        assert(K > 0);

        // remove the challenge target from group and remove the sender block
        usersInGroup[userWallet].inGroup = false;
        N--;
        penalty = address(this).balance/N;
        if(K > N) {
            K--;
        }
        usersInGroup[challenge.sender].lastChallengeBlock = 0;
        emit UserRemoved(userWallet, K, N);

        // if there are no more users in the group - transfer the contract balance to penaltyWallet
        if(N == 0) {
            penaltyWallet.transfer(address(this).balance);
        }
    }

    /**
    @notice Request to transfer a certain amount from the shared wallet to another address
    @param amount The requested amount of Wei to transfer
    @param receiver The destination address of the payment
    */
	function requestPayment(uint amount, address receiver)
    // indicates the consent of msg.sender to transfer “amount” to address “to”
	public
	{
        require(usersInGroup[msg.sender].inGroup == true, "You dont belong to the group");
        require(amount > 0, "Please ask for a positive amount");

        numberOfTransactions++;
        ledger[numberOfTransactions] = Transaction(receiver, amount, 0, false);
        emit PaymentRequested(amount, receiver, numberOfTransactions);
        approvePayment(numberOfTransactions);

	}

    /**
    @notice Give user's approval to send a requested payment.
    @param txId The id of the transaction which the user is willing to give approval
    */
    function approvePayment(uint txId)
    // indicates the msg.sender approve for transaction with the id txid
    public
    {
        require(usersInGroup[msg.sender].inGroup == true, "You dont belong to the group");
        require(txId > 0 && txId <= numberOfTransactions, "Transaction number is wrong");

        Transaction storage transaction = ledger[txId];
        if(transaction.usersApproves[msg.sender] == false)  // check if condition is valid
        {
            transaction.usersApproves[msg.sender] = true;
            transaction.count++;
            emit PaymentApproved(txId);
            if(transaction.count == K)
            {
                if((challenge.isActive == false && address(this).balance >= ledger[txId].amountToTransfer)
                || (challenge.isActive == true && address(this).balance >= ledger[txId].amountToTransfer + penalty)) {
                  transaction.transferred = true;
                  _makePayment(transaction.amountToTransfer, transaction.receiver);
                  emit PaymentTransferred(txId);
                }

            }
        }
    }

    /**
    @notice Make a payment to an address
    @dev Private function.
    */
    function _makePayment (uint amount, address to)
    // Initiates the transfer, called only when all K users gave their “permission”
    private
    {
        to.transfer(amount);
        penalty = address(this).balance/N;
    }

    /**
    @notice Send any amount of ether to the shared wallet
    */
    function()
    public
    payable
    {
        penalty = address(this).balance/N;
    }

    //-------------------------- KofNMultisig TEST FUNCTIONS -------------------
    /**
    @notice Get N
    @return {
        "N": "Number of members in the group"
    }
    */
    function getN()
    public
    view
    returns (uint)
    {
        return N;
    }

    /**
    @notice Get K
    @return {
        "K": "Number of required approvals"
    }
    */
    function getK()
    public
    view
    returns (uint)
    {
        return K;
    }

    /**
    @notice Get users' wallets
    @return {
        "usersWallets": "Users' wallets array"
    }
    */
    function getUsersWallets()
    public
    view
    returns (address[])
    {
        return usersWallets;
    }

    /**
    @notice Get user wallet
    @param userAddress The address of the user
    @return {
        "wallet": "The wallet address of the user"
    }
    */
    function getUserWallet(address userAddress)
    public
    view
    returns (address)
    {
        return usersInGroup[userAddress].wallet;
    }

    /**
    @notice Get user in group
    @param userAddress The address of the user
    @return {
        "inGroup": "True if the user belongs to the group, Flase otherwise"
    }
    */
    function getUserInGroup(address userAddress)
    public
    view
    returns (bool)
    {
        return usersInGroup[userAddress].inGroup;
    }

    /**
    @notice Get user challenged
    @param userAddress The address of the user
    @return {
        "inGroup": "True if the user is the challnge's target, Flase otherwise"
    }
    */
    function getUserChallenged(address userAddress)
    public
    view
    returns (bool)
    {
        return usersInGroup[userAddress].challenged;
    }

    /**
    @notice Get user last challenge block
    @param userAddress The address of the user
    @return {
        "lastChallengeBlock": "The last block this user published a challenge"
    }
    */
    function getUserLastChallengeBlock(address userAddress)
    public
    view
    returns (uint)
    {
        return usersInGroup[userAddress].lastChallengeBlock;
    }

    /**
    @notice Get challenge is active
    @return {
        "isActive": "True if there is an active challenge, False otherwise"
    }
    */
    function getChallengeIsActive()
    public
    view
    returns (bool)
    {
        return challenge.isActive;
    }

    /**
    @notice Get challenge's sender
    @return {
        "sender": "The challenge's sender"
    }
    */
    function getChallengeSender()
    public
    view
    returns (address)
    {
        return challenge.sender;
    }

    /**
    @notice Get challenge's target
    @return {
        "target": "The target of the challenge"
    }
    */
    function getChallengeTarget()
    public
    view
    returns (address)
    {
        return challenge.target;
    }

    /**
    @notice Get challenge start block
    @return {
        "startBlock": "The block that the challenge was published on"
    }
    */
    function getChallengeStartBlock()
    public
    view
    returns (uint)
    {
        return challenge.startBlock;
    }

    /**
    @notice Get transaction reciever
    @param txId The transaction Id
    @return {
        "receiver": "The address of the transaction destination"
    }
    */
    function getTransactionReceiver(uint txId)
    public
    view
    returns (address)
    {
        return ledger[txId].receiver;
    }

    /**
    @notice Get transaction amount to transfer
    @param txId The transaction Id
    @return {
        "amountToTransfer": "The requested amount of the transaction"
    }
    */
    function getTransactionAmountToTransfer(uint txId)
    public
    view
    returns (uint)
    {
        return ledger[txId].amountToTransfer;
    }

    /**
    @notice Get transaction count
    @param txId The transaction Id
    @return {
        "count": "Number of approvals of the transaction"
    }
    */
    function getTransactionCount(uint txId)
    public
    view
    returns (uint)
    {
        return ledger[txId].count;
    }

    /**
    @notice Get transaction user approve
    @param txId The transaction Id
    @param userAddress The address of the user
    @return {
        "userApprove": "True if the user approved txId transaction, False otherwise"
    }
    */
    function getTransactionUsersApprove(uint txId, address userAddress)
    public
    view
    returns (bool)
    {
        return ledger[txId].usersApproves[userAddress];
    }


    /**
    @notice Get transaction transferred
    @param txId The transaction Id
    @return {
        "transferred": "True if the transaction has been transferred, False otherwise"
    }
    */
    function getTransactionTransferred(uint txId)
    public
    view
    returns (bool)
    {
        return ledger[txId].transferred;
    }


    /**
    @notice Get penalty wallet
    @return {
        "penaltyWallet": "The address of the penalty wallet"
    }
    */
    function getPenaltyWallet()
    public
    pure
    returns (address)
    {
        return penaltyWallet;
    }

    /**
    @notice Get number of transactions
    @return {
        "numberOfTransactions": "The number of the requested transactions"
    }
    */
    function getNumberOfTransactions()
    public
    view
    returns (uint)
    {
        return numberOfTransactions;
    }

    /**
    @notice Get balance
    @return {
        "balance": "The balance of the contract wallet"
    }
    */
    function getBalance()
    public
    view
    returns (uint)
    {
        return address(this).balance;
    }

    /**
    @notice Get address
    @return {
        "address": "The address of the contract"
    }
    */
    function getAddress()
    public
    view
    returns (address)
    {
        return address(this);
    }

    function getPenalty()
    public
    view
    returns (uint)
    {
        return penalty;
    }
}
