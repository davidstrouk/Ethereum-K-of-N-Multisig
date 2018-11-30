// Version of solidity compiler this program was written for
pragma solidity ^0.5.0;

//-------------------------- KofNMultisig Contract --------------------------
  /**
  @author Shoval Loolian, David Strouk
  @notice Shared wallet of N people which requests the approval of K members for making a payment.
  */
contract KofNMultisig {

  // Constants
  uint constant BLOCKS_TO_RESPOND = 20;
  uint constant BLOCKS_TO_BLOCK = 50;
  address payable constant penaltyWallet = 0x56C509F889a8B6950a77d0E4D8a252D2a805A74d;
  address constant nullAddress = 0x0000000000000000000000000000000000000000;   // TBD
  uint constant penalty = 0.1 ether;  // should be total amount/K

  struct Challenge {
    bool isActive;
    address sender;
    address target;
    uint startBlock;
  }

  struct Transaction {
    address payable receiver;
    uint amountToTransfer;
    uint count;
    mapping (address => bool) usersApproves;
  }

  struct User {
    address wallet;
    bool inGroup;
    bool challenged;
    uint lastChallengeBlock;    // the last time this user published a challenge
  }

  uint N;
	uint K;
	mapping (address => User) usersInGroup;
	Challenge challenge;
	mapping (uint => Transaction) ledger;
	uint numberOfTransactions;

  /**
  @notice Initialize KofNMultisig contract with N wallets and K approvals
  @param wallets The wallets addresses of the N users
  @param k The size of required approvals
  */
  constructor(address[] memory wallets, uint k)
  public
  {
    require(wallets.length > 0,
      "There are no members in the group");
    require(k > 0 && k <= wallets.length,
        "K must be between 1 to N");
    N = wallets.length;
    K = k;
    for(uint i = 0; i < wallets.length ; i++) {
      usersInGroup[wallets[i]] = User(wallets[i], true, false, 0);
    }
	  challenge = Challenge(false, nullAddress, nullAddress, 0);
	  numberOfTransactions = 0;
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
	   require(usersInGroup[msg.sender].inGroup == true,
       "You dont belong to the group");    //same as: require(getUserIndexByAddress(target) != -1)
	   require(challenge.isActive == false,
       "There is already a published challenge");
	   require(msg.value >= penalty,
       "You dont have enough money to pay the penalty");
	   require(usersInGroup[target].inGroup == true,
       "Your target doesnt belong to the group");    //same as: require(getUserIndexByAddress(target) != -1)
	   require(usersInGroup[msg.sender].lastChallengeBlock == 0
       || block.number - usersInGroup[msg.sender].lastChallengeBlock >= BLOCKS_TO_BLOCK,
       "You are blocked from sending a challenge. Please wait");

	   challenge = Challenge(true, msg.sender, target, block.number);
	   usersInGroup[msg.sender].lastChallengeBlock = block.number;
	   usersInGroup[target].challenged = true;
	}

  /**
  @notice Respond to the published challenge. Collect from shared wallet an amount of penalty
  */
	function respondToChallenge()
  // Check if the function caller is the challenger’s target, answer the challenge if yes
	// and take a fee from the contract wallet
	public
	{
    require(usersInGroup[msg.sender].inGroup == true,
      "You dont belong to the group");
	  require(challenge.isActive == true,
      "There is no active challenge");
	  require(msg.sender == challenge.target,
      "You are not the target of the challenge. You cant respond to it");

    usersInGroup[msg.sender].challenged = false;
    challenge.isActive = false;

    // Punish the whole group by taking the penalty
    penaltyWallet.transfer(penalty);

	}

  /**
  @notice Try to remove the challenged user. If the challenged user has not answered after a certain amount of blocks (BLOCKS_TO_RESPOND), then he will be removed from group.
  */
	function tryToRemoveChallengedUser()
  // Called to trigger the removal of the user from the group in case times up
	public
	{
    require(usersInGroup[msg.sender].inGroup == true,
      "You dont belong to the group");
	  require(challenge.isActive == true,
      "There is no challenge");
	  require(usersInGroup[challenge.target].inGroup == true,
      "The user was already removed from the group");
	  if(block.number - challenge.startBlock > BLOCKS_TO_RESPOND) {
	    _removeFromGroup(challenge.target);
      challenge.isActive = false;
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
    if(K > N) {
      K--;
    }
    usersInGroup[challenge.sender].lastChallengeBlock = 0;

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
	function requestPayment(uint amount, address payable receiver)
  // indicates the consent of msg.sender to transfer “amount” to address "receiver"
	public
	{
    require(usersInGroup[msg.sender].inGroup == true,
      "You dont belong to the group");
    require(amount > 0,
      "Please ask for a positive amount");

    numberOfTransactions++;
    ledger[numberOfTransactions] = Transaction(receiver, amount, 0);
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
    require(usersInGroup[msg.sender].inGroup == true,
      "You dont belong to the group");
    require(txId > 0 && txId <= numberOfTransactions,
      "Transaction number is wrong");

    Transaction storage transaction = ledger[txId];
    if(transaction.usersApproves[msg.sender] == false)  // check if condition is valid
    {
      transaction.usersApproves[msg.sender] = true;
      transaction.count++;
      if(transaction.count == K)
      {
        if(challenge.isActive == true) {
          require(address(this).balance - ledger[txId].amountToTransfer >= penalty,
            "There is not enough money to make the transfer");
        }
        _makePayment(transaction.amountToTransfer, transaction.receiver);
      }
    }
  }

  /**
  @notice Make a payment to an address
  @dev Private function.
  */
  function _makePayment (uint amount, address payable to)
  // Initiates the transfer, called only when all K users gave their “permission”
  private
  {
    to.transfer(amount);
  }

  /**
  @notice Send any amount of ether to the shared wallet
  */
  function()
  external
  payable
  {}

}
