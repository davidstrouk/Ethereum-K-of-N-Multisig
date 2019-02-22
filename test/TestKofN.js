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

contract('Test K-of-N', async (accounts) => {

  const users_in_group = [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]];
  const user_out_of_group = accounts[9];
  const one_ether = 1000000000000000000; // 1 ether
  const ten_ether = 10000000000000000000; // 10 ether
  const eight_ether = 8000000000000000000; // 8 ether
  const valid_penalty = 100000000000000000; //0.1 ether
  const invalid_penalty = 10000000000000000; //0.01 ether
  const amount_to_transfer = 10000000000000000; //0.01 ether
  const BLOCKS_TO_RESPOND = 10;
  const BLOCKS_TO_BLOCK = 20;

  it("General Test K = N", async () => {
    var Error;
    var res;
    const _k = 5;

    let instance1 = await KofNMultisig.new(users_in_group, _k);

    // transfer ether to the contract
    web3.eth.sendTransaction({from:web3.eth.accounts[0] , to:instance1.address, value: web3.toWei(10, 'ether'), gasLimit: 21000, gasPrice: 20000000000})

    // chek init values
    res = await instance1.getN();
    assert.equal(res, users_in_group.length, "N is invalid");
    res = await instance1.getK();
    assert.equal(res, users_in_group.length, "K is invalid");

    // request for payments
    await instance1.requestPayment(one_ether, accounts[10], {from: users_in_group[3]});
    await instance1.approvePayment(1, {from: users_in_group[2]});
    await instance1.approvePayment(1, {from: users_in_group[4]});
    res = await instance1.getTransactionCount(1);
    assert.equal(res, 3, "transaction.count is invalid");
    await instance1.requestPayment(3249012357, accounts[4], {from: users_in_group[0]});
    await instance1.approvePayment(1, {from: users_in_group[0]});
    await instance1.approvePayment(2, {from: users_in_group[4]});

    // user 1 didnt approved, send a challenge
    await waitNBlocks(3);
    await instance1.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[3]});
    res = await instance1.getTransactionCount(1);
    assert.equal(res, 4, "transaction.count is invalid");
    await waitNBlocks(1);
    try {
      await instance1.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("There is already a published challenge"), -1, "sendChallenge error");

    // user 1 respond and then approve
    await waitNBlocks(1);
    var balance = await instance1.getBalance();
    await instance1.respondToChallenge({from: users_in_group[1]});
    await instance1.approvePayment(1, {from: users_in_group[1]});
    await instance1.approvePayment(2, {from: users_in_group[1]});
    res = await instance1.getChallengeIsActive();
    assert.equal(res, false, "challenge.isActive is invalid");
    res = await instance1.getBalance();
    assert.equal(res.toString(), balance-one_ether-valid_penalty, "contract.balance is invalid");
    res = await instance1.getTransactionCount(1);
    assert.equal(res, 5, "transaction.count is invalid");
    res = await instance1.getTransactionCount(2);
    assert.equal(res, 3, "transaction.count is invalid");

    // user 3 is blocked from sending a challenge
    await waitNBlocks(20);
    try {
      await instance1.sendChallenge(users_in_group[2], {value: valid_penalty, from: users_in_group[3]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You are blocked from sending a challenge. Please wait"), -1, "sendChallenge error");

    // user 3 dont respond to txId=2 and remove from the group
    await instance1.approvePayment(2, {from: users_in_group[2]});
    await instance1.sendChallenge(users_in_group[3], {value: valid_penalty, from: users_in_group[4]});
    await waitNBlocks(BLOCKS_TO_RESPOND);
    await instance1.tryToRemoveChallengedUser({from: users_in_group[1]});
    try {
      await instance1.respondToChallenge({from: users_in_group[3]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "sendChallenge error");
    res = await instance1.getK();
    assert.equal(res, users_in_group.length-1, "new K is invalid");

    // user 0 send a challenge to himself and respond
    await instance1.sendChallenge(users_in_group[0], {value: valid_penalty, from: users_in_group[0]});
    await waitNBlocks(5);
    await instance1.tryToRemoveChallengedUser({from: users_in_group[1]});
    res = await instance1.getK();
    assert.equal(res, users_in_group.length-1, "new K is invalid");
    await instance1.respondToChallenge({from: users_in_group[0]});
    res = await instance1.getUserInGroup(users_in_group[0]);
    assert.equal(res, true, "user.inGroup is invalid");

    // user 1 send a challenge to himself and dont respond
    await instance1.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[1]});
    await waitNBlocks(BLOCKS_TO_RESPOND);
    await instance1.tryToRemoveChallengedUser({from: users_in_group[4]});
    res = await instance1.getUserInGroup(users_in_group[1]);
    assert.equal(res, false, "user.inGroup is invalid");
    res = await instance1.getK();
    assert.equal(res, users_in_group.length-2, "new K is invalid");

    // user 3 try to use the contract
    try {
      await instance1.sendChallenge(users_in_group[1], {from: users_in_group[3]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "sendChallenge error");
    try {
      await instance1.respondToChallenge({from: users_in_group[3]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "respondToChallenge error");
    try {
      await instance1.tryToRemoveChallengedUser({from: users_in_group[3]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "tryToRemoveChallengedUser error");

    try {
      await instance1.requestPayment(6, users_in_group[3], {from: users_in_group[3]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "requestPayment error");
    try {
      await instance1.approvePayment(2,{from: users_in_group[3]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "approvePayment error");

    // check data about transaction 2
    res = await instance1.getTransactionCount(2);
    assert.equal(res.toString(), 4, "transaction.count is invalid");
    res = await instance1.getTransactionUsersApprove(2, users_in_group[1]);
    assert.equal(res, true, "transaction.approve is invalid");
    res = await instance1.getTransactionUsersApprove(2, users_in_group[3]);
    assert.equal(res, false, "transaction.approve is invalid");

    // user 2 approve transaction and then get out of the group
    await waitNBlocks(BLOCKS_TO_BLOCK);
    await instance1.requestPayment(eight_ether, accounts[8], {from: users_in_group[0]});
    await instance1.approvePayment(3,{from: users_in_group[2]});
    await instance1.sendChallenge(users_in_group[2], {value: valid_penalty, from: users_in_group[0]});
    await waitNBlocks(BLOCKS_TO_RESPOND);
    await instance1.tryToRemoveChallengedUser({from: users_in_group[0]});
    res = await instance1.getUserInGroup(users_in_group[2]);
    assert.equal(res, false, "user.inGroup is invalid");
    try {
    await instance1.approvePayment(4,{from: users_in_group[4]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "approvePayment error");

    // check with david what happen in this case: 3 people in the group, 1 approve and then get off the group, whst happen when the third user approve???
    // check the balance if transaction should happen or not


    // transaction approve by all users but there is not enough money
    var balance = await instance1.getBalance();
    await instance1.requestPayment(balance, accounts[8], {from: users_in_group[0]});
    try {
    await instance1.approvePayment(4,{from: users_in_group[4]});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("There is not enough money to make the transfer"), -1, "approvePayment error");

    // transfer money to the account but cant re-approve transaction 5 (balance stay the same)
    web3.eth.sendTransaction({from:web3.eth.accounts[0] , to:instance1.address, value: web3.toWei(5, 'ether'), gasLimit: 21000, gasPrice: 20000000000})
    var balance2 = await instance1.getBalance();
    console.log('balance: %d',balance2);
    await instance1.approvePayment(4, {from: users_in_group[4]});
    res = await instance1.getBalance();
    console.log('after balance: %d',res);
    assert.equal(res, balance2, "approvePayment error");


  });

  it("General Test K < N", async () => {
    var Error;
    var res;
    const _k = 3;

    const david_address = accounts[0];
    const aaron_address = accounts[1];
    const ness_address = accounts[2];
    const ouri_address = accounts[3];
    const ilana_address = accounts[4];

    let instance = await KofNMultisig.new(users_in_group, _k);

    // transfer ether to the contract
    web3.eth.sendTransaction({from:web3.eth.accounts[0] , to:instance.address, value: web3.toWei(10, 'ether'), gasLimit: 21000, gasPrice: 20000000000})

    // chek init values
    res = await instance.getN();
    assert.equal(res, users_in_group.length, "N is invalid");
    res = await instance.getK();
    assert.equal(res, _k, "K is invalid");

    await instance.sendChallenge(aaron_address, {from: david_address, value: valid_penalty});
    res = await instance.getChallengeIsActive();
    assert.equal(res, true, "challenge.isActive is wrong");
    res = await instance.getChallengeSender();
    assert.equal(res, david_address, "challenge.sender is wrong");
    res = await instance.getChallengeTarget();
    assert.equal(res, aaron_address, "challenge.target is wrong");
    res = await instance.getUserChallenged(aaron_address);
    assert.equal(res, true, "userChallenged is wrong");
    res = await instance.getBalance();
    assert.equal(res, 10*one_ether+valid_penalty, "Balance is wrong");

    await waitNBlocks(BLOCKS_TO_RESPOND/2);

    await instance.respondToChallenge({from: aaron_address});
    res = await instance.getChallengeIsActive();
    assert.equal(res, false, "challenge.isActive is wrong");
    res = await instance.getUserChallenged(aaron_address);
    assert.equal(res, false, "userChallenged is wrong");
    res = await instance.getBalance();
    assert.equal(res, 10*one_ether, "Balance is wrong");

    // Payment from common wallet to someone which is in the group
    await instance.requestPayment(valid_penalty*2, david_address, {from: aaron_address});
    const tx_id = 1
    res = await instance.getNumberOfTransactions();
    assert.equal(res, tx_id, "numberOfTransactions is wrong");
    res = await instance.getTransactionCount(tx_id);
    assert.equal(res, 1, "transaction.count is wrong");
    res = await instance.getTransactionReceiver(tx_id);
    assert.equal(res, david_address, "transaction.receiver is wrong");
    res = await instance.getTransactionAmountToTransfer(tx_id);
    assert.equal(res, 2*valid_penalty, "transaction.amount_to_transfer is wrong");
    res = await instance.getTransactionUsersApprove(tx_id, aaron_address);
    assert.equal(res, true, "transaction.usersApprove is wrong");
    res = await instance.getTransactionUsersApprove(tx_id, david_address);
    assert.equal(res, false, "transaction.usersApprove is wrong");

    // The member of the group David approves the transaction to himself
    // (nothing prevents from this: is it OK? I think yes - check with Shoval)
    await instance.approvePayment(tx_id, {from: david_address});
    res = await instance.getTransactionCount(tx_id);
    assert.equal(res, 2, "transaction.count is wrong");
    res = await instance.getTransactionUsersApprove(tx_id, aaron_address);
    assert.equal(res, true, "transaction.usersApprove is wrong");
    res = await instance.getTransactionUsersApprove(tx_id, david_address);
    assert.equal(res, true, "transaction.usersApprove is wrong");
    res = await instance.getBalance();
    assert.equal(res, 10*one_ether, "Balance is wrong");

    const new_balance = 10*one_ether-2*valid_penalty;
    // A third person in group (Ness) approves the payment
    // Since it is 3 out of 5 payment is accepted
    await instance.approvePayment(tx_id, {from: ness_address});
    res = await instance.getTransactionCount(tx_id);
    assert.equal(res, 3, "transaction.count is wrong");
    res = await instance.getTransactionUsersApprove(tx_id, ness_address);
    assert.equal(res, true, "transaction.usersApprove is wrong");
    res = await instance.getBalance();
    assert.equal(res, new_balance, "Balance is wrong");

    await instance.sendChallenge(david_address, {from: ilana_address, value: 2*valid_penalty});
    await waitNBlocks(BLOCKS_TO_BLOCK);
    // user tries to remove himself (I think it is OK - check with Shoval)
    await instance.tryToRemoveChallengedUser({from: david_address});
    res = await instance.getN();
    assert.equal(res, 4, "N is wrong");
    res = await instance.getK();
    assert.equal(res, 3, "K is wrong");

    // David is out of group and he tries to request a payment: receives error
    try {
      await instance.requestPayment(one_ether, aaron_address, {from: david_address});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You dont belong to the group"), -1, "requestPayment error");

    // Ouri sends a challenge to Ness and she answers
    await instance.sendChallenge(ness_address, {from: ouri_address, value: valid_penalty});
    await instance.respondToChallenge({from: ness_address});

    // Now Ouri tries to send another challenge: he is blocked
    try {
      await instance.sendChallenge(ilana_address, {from: ouri_address, value: valid_penalty});
    } catch (error) {
      Error = error;
    }
    assert.notEqual(Error, undefined, 'Error must be thrown');
    assert.isAbove(Error.message.search("You are blocked from sending a challenge. Please wait"), -1, "sendChallenge error");

    await waitNBlocks(BLOCKS_TO_BLOCK);

    // We waited BLOCKS_TO_BLOCK so Ouri can send a challenge now
    // He is sending to Ness and this time she doesn't answer
    await instance.sendChallenge(ness_address, {from: ouri_address, value: valid_penalty});
    await waitNBlocks(BLOCKS_TO_RESPOND);
    await instance.tryToRemoveChallengedUser({from: ouri_address});

    res = await instance.getN();
    assert.equal(res, 3, "N is wrong");
    res = await instance.getK();
    assert.equal(res, 3, "K is wrong");

    // From this point same case as K = N
  });

});
