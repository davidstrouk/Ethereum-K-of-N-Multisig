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

contract('TestKofN', async (accounts) => {

  const users_in_group = [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]];
  const _k = 5;
  const user_out_of_group = accounts[9];
  // const external_wallet = accounts[10];
  const one_ether = 1000000000000000000; // 1 ether
  const valid_penalty = 100000000000000000; //0.1 ether
  const invalid_penalty = 10000000000000000; //0.01 ether
  const amount_to_transfer = 10000000000000000; //0.01 ether
  const BLOCKS_TO_RESPOND = 20;

  it("generalTestKequalN", async () => {

      var res;

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
        await instance1.respondToChallenge({from: users_in_group[1]});
        await instance1.approvePayment(1, {from: users_in_group[1]});
        await instance1.approvePayment(2, {from: users_in_group[1]});
//         res = await instance1.getChallengeIsActive();
//         assert.equal(res, false, "challenge.isActive is invalid");
// // check punishment
//         res = await instance1.getTransactionCount(1);
//         assert.equal(res, 5, "transaction.count is invalid");
//         res = await instance1.getTransactionCount(2);
//         assert.equal(res, 3, "transaction.count is invalid");
// // check user 3 is blocked
// //check the balance
//
//



        //
        // waitNBlocks(BLOCKS_TO_RESPOND/2);
        // await instance1.respondToChallenge({from: users_in_group[1]});
        //
        // res = await instance4.getUserChallenged(users_in_group[1]);
        // assert.equal(res, false, "user.challenged is invalid");
        //
        // res = await instance4.getChallengeIsActive();
        // assert.equal(res, false, "challenge.isActive is invalid");
        //
        // res = await instance4.getK();
        // assert.equal(res.toString(), init_K.toString(), "wrong value of K");
        //
        // res = await instance4.getBalance();
        // assert.equal(res.toString(), init_balance-valid_penalty, "invalid penalty transfer");

      });



});
