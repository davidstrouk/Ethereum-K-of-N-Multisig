var KofNMultisig = artifacts.require("KofNMultisig");
const util = require('util');

const waitNBlocks = async n => {
  const sendAsync = util.promisify(web3.currentProvider.sendAsync);
  await Promise.all(
    [...Array(n).keys()].map(i =>
      sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: i
      })
    )
  );
};

contract('Test K-of-N Functions', async (accounts) => {

  const users_in_group = [accounts[0], accounts[1], accounts[2]];
  const david_address = accounts[0];
  const barak_address = accounts[1];
  const shoval_address = accounts[2];
  const ruhama_address = accounts[3];
  const four_users_in_group = [david_address, barak_address, shoval_address, ruhama_address];
  const _k = 2;
  const external_wallet = "0xB7cC9D851FbF7A445387cAC079a045309B5893F8";
  const user_out_of_group = accounts[4];
  const one_ether = 1000000000000000000; // 1 ether
  const valid_penalty = 100000000000000000; //0.1 ether
  const invalid_penalty = 10000000000000000; //0.01 ether
  const amount_to_transfer = 10000000000000000; //0.01 ether
  const BLOCKS_TO_RESPOND = 20;

  it("testConstructor", async () => {
    var Error;
    var res;
    var transactions_iter = 1;

    // ----------------------REQUIRE #1--------------------------
    try {
      let instance1 = await KofNMultisig.new([], _k);
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("There are no members in the group"), -1, "Require #1 Failed");

    // ----------------------REQUIRE #2--------------------------
    try {
      let instance2 = await KofNMultisig.new(users_in_group, 0);
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("K must be between 1 to N"), -1, "Require #2.1 Failed");

    try {
      let instance2 = await KofNMultisig.new(users_in_group, users_in_group.length+1);
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("K must be between 1 to N"), -1, "Require #2.2 Failed");

    // ----------------------FUNCTION TEST--------------------------
    let instance3 = await KofNMultisig.new(users_in_group, _k);

    res = await instance3.getN();
    assert.equal(res, users_in_group.length, "N is invalid");
    res = await instance3.getK();
    assert.equal(res, _k, "K is invalid");

    for (i=0; i<users_in_group.length; i++) {
      res = await instance3.getUserWallet(accounts[i]);
      assert.equal(res, accounts[i], "user.wallet."+[i]+" is invalid");
      res = await instance3.getUserInGroup(accounts[i]);
      assert.equal(res, true, "user.inGroup."+[i]+" is invalid");
      res = await instance3.getUserChallenged(accounts[i]);
      assert.equal(res, false, "user.challenged."+[i]+" is invalid");
      res = await instance3.getUserLastChallengeBlock(accounts[i]);
      assert.equal(res, 0, "user.lastChallengeBlock."+[i]+" is invalid");
    }

    res = await instance3.getChallengeIsActive();
    assert.equal(res, false, "challenge.isActive is invalid");
    res = await instance3.getChallengeSender();
    assert.equal(res, 0, "challenge.sender is invalid");
    res = await instance3.getChallengeTarget();
    assert.equal(res, 0, "challenge.target is invalid");
    res = await instance3.getChallengeStartBlock();
    assert.equal(res, 0, "challenge.startBlock is invalid");

    res = await instance3.getNumberOfTransactions();
    assert.equal(res, 0, "numberOfTransactionsis invalid");

  });

  it("testSendChallenge", async () => {

    var Error;
    var res;

    // ----------------------REQUIRE #1--------------------------
    let instance1 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance1.sendChallenge(users_in_group[0], {value: valid_penalty, from: user_out_of_group});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "Require #1 Failed");


    // ----------------------REQUIRE #2--------------------------
    let instance2 = await KofNMultisig.new(users_in_group, _k);
    // Good challenge
    await instance2.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});

    try {
      await instance2.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("There is already a published challenge"), -1, "Require #2 Failed");

    try {
      await instance2.sendChallenge(users_in_group[0], {value: valid_penalty, from: users_in_group[1]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("There is already a published challenge"), -1, "Require #2 Failed");


    // ----------------------REQUIRE #3--------------------------
    let instance3 = await KofNMultisig.new(users_in_group, _k);
    try {
     await instance3.sendChallenge(users_in_group[1], {value: invalid_penalty, from: users_in_group[0]});
    } catch (error) {
        Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont have enough money to pay the penalty"), -1, "Require #3 Failed");

    // ----------------------REQUIRE #4--------------------------
    let instance4 = await KofNMultisig.new(users_in_group, _k);
    try {
     await instance4.sendChallenge(user_out_of_group, {value: valid_penalty, from: users_in_group[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("Your target doesnt belong to the group"), -1, "Require #4 Failed");


    // ----------------------REQUIRE #5--------------------------
    let instance5 = await KofNMultisig.new(users_in_group, _k);
    await instance5.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    await instance5.respondToChallenge({from: users_in_group[1]});
    await waitNBlocks(1);
    try {
     await instance5.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You are blocked from sending a challenge. please wait"), -1, "Require #5 Failed");


    // ----------------------FUNCTION TEST--------------------------
    let instance6 = await KofNMultisig.new(users_in_group, _k);

    res = await instance6.getChallengeIsActive();
    assert.equal(res, false, "challenge.isActive is invalid");

    await instance6.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});

    res = await instance6.getChallengeIsActive();
    assert.equal(res, true, "challenge.isActive is invalid");

    res = await instance6.getChallengeSender();
    assert.equal(res, users_in_group[0], "challenge.sender is invalid");

    res = await instance6.getChallengeTarget();
    assert.equal(res, users_in_group[1], "challenge.target is invalid");

    var startBlockFromWeb3 = await web3.eth.blockNumber;

    var startBlock = await instance6.getChallengeStartBlock();
    assert.equal(startBlock, startBlockFromWeb3, "challenge.startBlock is invalid");

    res = await instance6.getUserLastChallengeBlock(users_in_group[0]);
    assert.equal(res, startBlockFromWeb3, "usersInGroup[msg.sender].lastChallengeBlock is invalid");

    res = await instance6.getUserChallenged(users_in_group[1]);
    assert.equal(res, true, "usersInGroup[target].challenged is invalid");


    ////// WORK IN PROGRESS ///////
    await instance6.respondToChallenge({from: users_in_group[1]});
    await waitNBlocks(BLOCKS_TO_RESPOND);
    try {
     await instance6.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You are blocked from sending a challenge. please wait"), -1, "Require #5 Failed");
  });

  it("testTryToRemoveChallengedUser", async () => {
    var Error;
    var res;

    // ----------------------REQUIRE #1--------------------------
    let instance1 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance1.tryToRemoveChallengedUser({from: user_out_of_group});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "Require #1 Failed");

    // ----------------------REQUIRE #2--------------------------
    let instance2 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance2.tryToRemoveChallengedUser();
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("There is no challenge"), -1, "Require #2 Failed");


    // ----------------------NORMAL BEHAVIOR TEST (WITH REMOVAL)--------------------------
    let instance3 = await KofNMultisig.new(users_in_group, _k);
    // Good challenge
    await instance3.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    await waitNBlocks(BLOCKS_TO_RESPOND + 2);
    await instance3.tryToRemoveChallengedUser();

    res = await instance3.getUserInGroup(users_in_group[1]);
    assert.equal(res, false, "User has not been removed from group");

    // ----------------------NORMAL BEHAVIOR TEST (WITHOUT REMOVAL)--------------------------
    let instance4 = await KofNMultisig.new(users_in_group, _k);
    // Good challenge
    await instance4.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    res = await instance4.getChallengeStartBlock();
    await instance4.tryToRemoveChallengedUser();

    res = await instance4.getUserInGroup(users_in_group[1]);
    assert.equal(res, true, "User has been removed from group");

    // ----------------------REQUIRE #3--------------------------
    let instance5 = await KofNMultisig.new(four_users_in_group, _k);
    await instance5.sendChallenge(shoval_address, {value: valid_penalty, from: david_address});
    await waitNBlocks(BLOCKS_TO_RESPOND + 1);

    await instance5.tryToRemoveChallengedUser();
    res = await instance5.getUserInGroup(shoval_address);
    assert.equal(res, false, "User has not been removed from group");

    // await instance5.sendChallenge(ruhama_address, {value: valid_penalty, from: david_address});
    // try {
    //   await instance5.tryToRemoveChallengedUser({from: barak_address});
    // } catch (error) {
    //   Error = error;
    // }
    // assert.notEqual(Error, undefined, 'Error must be thrown');
    // assert.isAbove(Error.message.search("The user was already removed from the group"), -1, "Require #3 Failed");

  });

  it("testRespondToChallenge", async () => {

    var Error;
    var res;

    // ----------------------REQUIRE #1--------------------------
    let instance1 = await KofNMultisig.new(users_in_group, _k);
    try {
     await instance1.respondToChallenge({from: user_out_of_group});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "Require #1.1 Failed");

    await instance1.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    await waitNBlocks(BLOCKS_TO_RESPOND+1);
    try {
      await instance1.respondToChallenge({from: users_in_group[1]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "Require #1.2 Failed");

    // ----------------------REQUIRE #2--------------------------
    let instance2 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance2.respondToChallenge({from: users_in_group[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("There is no active challenge"), -1, "Require #2 Failed");

    // ----------------------REQUIRE #3--------------------------
    let instance3 = await KofNMultisig.new(users_in_group, _k);
    // Good challenge
    await instance3.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});

    try {
      await instance3.respondToChallenge({from: users_in_group[2]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You are not the target of the challenge. You cant respond to it"), -1, "Require #3 Failed");

    // ----------------------FUNCTION TEST--------------------------
    let instance4 = await KofNMultisig.new(users_in_group, _k);

    // transfer ether to the contract
    web3.eth.sendTransaction({from:web3.eth.accounts[0] , to:instance4.address, value: web3.toWei(1, 'ether'), gasLimit: 21000, gasPrice: 20000000000})

    var init_K = await instance4.getK();
    // console.log('init balance: %d',init_balance);
    await instance4.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    var init_balance = await instance4.getBalance();

    res = await instance4.getChallengeTarget();
    assert.equal(res, users_in_group[1], "challenge.target is invalid");

    res = await instance4.getChallengeIsActive();
    assert.equal(res, true, "challenge.isActive is invalid");

    await waitNBlocks(BLOCKS_TO_RESPOND/2);
    await instance4.respondToChallenge({from: users_in_group[1]});

    res = await instance4.getUserChallenged(users_in_group[1]);
    assert.equal(res, false, "user.challenged is invalid");

    res = await instance4.getChallengeIsActive();
    assert.equal(res, false, "challenge.isActive is invalid");

    res = await instance4.getK();
    assert.equal(res.toString(), init_K.toString(), "wrong value of K");

    res = await instance4.getBalance();
    assert.equal(res.toString(), init_balance-valid_penalty, "invalid penalty transfer");

  });

  it("testRequestPayment", async () => {

    var Error;
    var res;
    var transactions_iter = 1;

    // ----------------------REQUIRE #1--------------------------
    let instance1 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance1.requestPayment(amount_to_transfer, external_wallet, {from: user_out_of_group});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "Require #1 Failed");

    // ----------------------REQUIRE #2--------------------------
    let instance2 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance2.requestPayment(0, external_wallet, {from: users_in_group[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("Please ask for a possitive amount"), -1, "Require #2.1 Failed");

    try {
      await instance2.requestPayment(-amount_to_transfer, external_wallet, {from: users_in_group[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("Please ask for a possitive amount"), -1, "Require #2.2 Failed");

    // ----------------------FUNCTION TEST--------------------------
    let instance3 = await KofNMultisig.new(users_in_group, _k);

    await instance3.requestPayment(amount_to_transfer, external_wallet, {from: users_in_group[0]});
    res = await instance3.getTransactionReceiver(transactions_iter);
    assert.equal(res.toString(), external_wallet.toLowerCase(), "transaction.receiver is invalid");
    res = await instance3.getTransactionAmountToTransfer(transactions_iter);
    assert.equal(res.toString(), amount_to_transfer, "transaction.amountToTransfer is invalid");
    res = await instance3.getTransactionCount(transactions_iter);
    assert.equal(res.toString(), 1, "transaction.count is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[0]);
    assert.equal(res, true, "transaction.approve.sender is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[1]);
    assert.equal(res, false, "transaction.approve.otherMember is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[2]);
    assert.equal(res, false, "transaction.approve.otherMember is invalid");
    res = await instance3.getNumberOfTransactions();
    assert.equal(res.toString(), transactions_iter, "NumberOfTransactions is invalid");

    await instance3.requestPayment(amount_to_transfer, external_wallet, {from: users_in_group[1]});
    res = await instance3.getTransactionReceiver(transactions_iter);
    assert.equal(res.toString(), external_wallet.toLowerCase(), "transaction.receiver is invalid");
    res = await instance3.getTransactionAmountToTransfer(transactions_iter);
    assert.equal(res.toString(), amount_to_transfer, "transaction.amountToTransfer is invalid");
    res = await instance3.getTransactionCount(transactions_iter);
    assert.equal(res.toString(), 1, "transaction.count is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[0]);
    assert.equal(res, true, "transaction.approve.sender is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[1]);
    assert.equal(res, false, "transaction.approve.otherMember is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[2]);
    assert.equal(res, false, "transaction.approve.otherMember is invalid");

    transactions_iter++;
    res = await instance3.getNumberOfTransactions();
    assert.equal(res.toString(), transactions_iter, "NumberOfTransactions is invalid");

    res = await instance3.getTransactionReceiver(transactions_iter);
    assert.equal(res.toString(), external_wallet.toLowerCase(), "transaction.receiver is invalid");
    res = await instance3.getTransactionAmountToTransfer(transactions_iter);
    assert.equal(res.toString(), amount_to_transfer, "transaction.amountToTransfer is invalid");
    res = await instance3.getTransactionCount(transactions_iter);
    assert.equal(res.toString(), 1, "transaction.count is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[0]);
    assert.equal(res, false, "transaction.approve.sender is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[1]);
    assert.equal(res, true, "transaction.approve.otherMember is invalid");
    res = await instance3.getTransactionUsersApprove(transactions_iter, users_in_group[2]);
    assert.equal(res, false, "transaction.approve.otherMember is invalid");
    res = await instance3.getNumberOfTransactions();
    assert.equal(res.toString(), transactions_iter, "NumberOfTransactions is invalid");

  });

  it("testApprovePayment", async () => {

    var Error;
    var res;

    // ----------------------TEST 1: REQUIRE #1--------------------------
    let instance1 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance1.approvePayment(0, {from: user_out_of_group});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "Require #1 Failed");

    // ----------------------TEST 2: REQUIRE #2.1--------------------------
    let instance2 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance2.approvePayment(0, {from: accounts[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("Transaction number is wrong"), -1, "Require #2.1 Failed");

    // ----------------------TEST 3: REQUIRE #2.2--------------------------
    let instance3 = await KofNMultisig.new(users_in_group, _k);
    try {
      await instance3.approvePayment(1, {from: accounts[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("Transaction number is wrong"), -1, "Require #2.2 Failed");

    // ----------------------TEST 4: REQUIRE #3--------------------------
    let amount = one_ether + valid_penalty;
    let instance4 = await KofNMultisig.new(users_in_group, _k);

    let init_balance4 = await instance4.getBalance();
    assert.equal(init_balance4, 0, "Initial balance is wrong");

    let instance4_address = await instance4.getAddress();
    await web3.eth.sendTransaction({from: accounts[0], to: instance4_address, value: one_ether});
    let new_balance1 = await instance4.getBalance();
    assert.equal(new_balance1, one_ether, "Balance is wrong");
    await instance4.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    let new_balance2 = await instance4.getBalance();
    assert.equal(new_balance2, one_ether + valid_penalty, "Balance is wrong");
    await instance4.requestPayment(amount, user_out_of_group, {from: users_in_group[0]});
    try {
      await instance4.approvePayment(1, {from: users_in_group[1]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("There is not enough money to make the transfer"), -1, "Require #3 Failed");


    // ----------------------TEST 5: SENDING TOO MUCH--------------------------
    let instance5 = await KofNMultisig.new(users_in_group, _k);

    let init_balance5 = await instance5.getBalance();
    assert.equal(init_balance5, 0, "Initial balance is wrong");

    let instance5_address = await instance5.getAddress();
    await web3.eth.sendTransaction({from: accounts[0], to: instance5_address, value: amount});
    let new_balance = await instance5.getBalance();
    assert.equal(new_balance, amount, "Balance is wrong");
    await instance5.requestPayment(one_ether, user_out_of_group, {from: users_in_group[0]});

    try {
      await instance5.approvePayment(1, {from: users_in_group[1]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');

    // ----------------------TEST 6: FUNCTION TEST--------------------------
    let instance6 = await KofNMultisig.new(users_in_group, _k);

    let init_balance6 = await instance6.getBalance();
    assert.equal(init_balance6, 0, "Initial balance is wrong");

    let instance6_address = await instance6.getAddress();
    await web3.eth.sendTransaction({from: accounts[0], to: instance6_address, value: one_ether});
    let new_balance6 = await instance6.getBalance();
    assert.equal(new_balance6, one_ether, "Balance is wrong");
    await instance6.requestPayment(one_ether, user_out_of_group, {from: users_in_group[0]});

    await instance6.approvePayment(1, {from: users_in_group[1]});
    let zero_balance6 = await instance6.getBalance();
    assert.equal(zero_balance6, 0, "Balance is not correct");

  });

});
