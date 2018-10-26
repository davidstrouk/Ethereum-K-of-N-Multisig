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

  const users_in_group = [accounts[0], accounts[1]];
  const user_out_of_group = "0x9cEECBB913801F15C845C97454d9C92b4033160C";
  const valid_penalty = 100000000000000000; //0.1 ether
  const invalid_penalty = 10000000000000000; //0.01 ether
  const BLOCKS_TO_RESPOND = 20;

  it("testSendChallenge", async () => {

    var Error;
    var res;

    // REQUIRE #1
    let instance1 = await KofNMultisig.new(users_in_group);
    try {
     await instance1.sendChallenge(users_in_group[0], {value: valid_penalty, from: user_out_of_group});
   } catch (error) {
        Error = error;
    }
        assert.notEqual(Error, undefined, 'Error must be thrown');
        assert.isAbove(Error.message.search("You dont belong to the group"), -1, "Require #1 Failed");


    // ----------------------REQUIRE #2--------------------------
    let instance2 = await KofNMultisig.new(users_in_group);
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
      let instance3 = await KofNMultisig.new(users_in_group);
      try {
       await instance3.sendChallenge(users_in_group[1], {value: invalid_penalty, from: users_in_group[0]});
      } catch (error) {
          Error = error;
      }
          assert.notEqual(Error, undefined, 'Error must be thrown');
          assert.isAbove(Error.message.search("You dont have enough money to pay the penalty"), -1, "Require #3 Failed");

      // ----------------------REQUIRE #4--------------------------
      let instance4 = await KofNMultisig.new(users_in_group);
      try {
       await instance4.sendChallenge(user_out_of_group, {value: valid_penalty, from: users_in_group[0]});
      } catch (error) {
          Error = error;
      }
          assert.notEqual(Error, undefined, 'Error must be thrown');
          assert.isAbove(Error.message.search("Your target doesnt belong to the group"), -1, "Require #4 Failed");


      // ----------------------REQUIRE #5--------------------------
      let instance5 = await KofNMultisig.new(users_in_group);
      await instance5.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
      await instance5.respondToChallenge({from: users_in_group[1]});
      waitNBlocks(1);
      try {
       await instance5.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
      } catch (error) {
          Error = error;
      }
      assert.notEqual(Error, undefined, 'Error must be thrown');
      assert.isAbove(Error.message.search("You are blocked from sending a challenge. please wait"), -1, "Require #5 Failed");


      // ----------------------FUNCTION TEST--------------------------
      let instance6 = await KofNMultisig.new(users_in_group);

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
      waitNBlocks(BLOCKS_TO_RESPOND);
      try {
       await instance6.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
      } catch (error) {
          Error = error;
      }
      assert.notEqual(Error, undefined, 'Error must be thrown');
      assert.isAbove(Error.message.search("You are blocked from sending a challenge. please wait"), -1, "Require #5 Failed");
    });
});
