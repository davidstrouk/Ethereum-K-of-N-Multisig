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
  const valid_penalty = 100000000000000000; //0.1 ether
  const invalid_penalty = 10000000000000000; //0.01 ether
  const amount_to_transfer = 10000000000000000; //0.01 ether
  const BLOCKS_TO_RESPOND = 20;

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
    assert.isAbove(Error.message.search("You are blocked from sending a challenge. please wait"), -1, "sendChallenge error");

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
  });

  it("General Test K < N", async () => {
    var Error;
    var res;
    const _k = 3;

    let instance = await KofNMultisig.new(users_in_group, _k);

    // transfer ether to the contract
    web3.eth.sendTransaction({from:web3.eth.accounts[0] , to:instance.address, value: web3.toWei(10, 'ether'), gasLimit: 21000, gasPrice: 20000000000})

    // chek init values
    res = await instance.getN();
    assert.equal(res, users_in_group.length, "N is invalid");
    res = await instance.getK();
    assert.equal(res, _k, "K is invalid");


  });

});
