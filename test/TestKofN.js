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

  const users_in_group = [accounts[0], accounts[1], accounts[2]];
  const _k = 2;
  const user_out_of_group = "0x09b537A522072DFc8B56626428dF82263F6bd21e";
  const valid_penalty = 100000000000000000; //0.1 ether
  const invalid_penalty = 10000000000000000; //0.01 ether
  const BLOCKS_TO_RESPOND = 20;

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
      waitNBlocks(1);
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
      waitNBlocks(BLOCKS_TO_RESPOND);
      try {
       await instance6.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
      } catch (error) {
          Error = error;
      }
      assert.notEqual(Error, undefined, 'Error must be thrown');
      assert.isAbove(Error.message.search("You are blocked from sending a challenge. please wait"), -1, "Require #5 Failed");
    });

    it("tryToRemoveChallengedUser", async () => {
      var Error;
      var res;

      // ----------------------REQUIRE #1--------------------------
      let instance1 = await KofNMultisig.new(users_in_group, _k);
      try {
       await instance1.tryToRemoveChallengedUser();
     } catch (error) {
          Error = error;
      }
          assert.notEqual(Error, undefined, 'Error must be thrown');
          assert.isAbove(Error.message.search("There is no challenge"), -1, "Require #1 Failed");


      // ----------------------NORMAL BEHAVIOR TEST (WITH REMOVAL)--------------------------
      let instance2 = await KofNMultisig.new(users_in_group, _k);
      // Good challenge
      await instance2.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
      waitNBlocks(BLOCKS_TO_RESPOND + 2);
      await instance2.tryToRemoveChallengedUser();

      res = await instance2.getUserInGroup(users_in_group[1]);
      assert.equal(res, false, "User has not been removed from group");

      // ----------------------NORMAL BEHAVIOR TEST (WITHOUT REMOVAL)--------------------------
      let instance3 = await KofNMultisig.new(users_in_group, _k);
      // Good challenge
      await instance3.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
      res = await instance3.getChallengeStartBlock();
      await instance3.tryToRemoveChallengedUser();

      res = await instance3.getUserInGroup(users_in_group[1]);
      assert.equal(res, true, "User has been removed from group");


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
      assert.isAbove(Error.message.search("You are not a part of the group"), -1, "Require #1 Failed");

// TBD: ask david
      // // ----------------------REQUIRE #2--------------------------
      // let instance2 = await KofNMultisig.new(users_in_group);
      // await instance2.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
      // waitNBlocks(BLOCKS_TO_RESPOND+1);
      // try {
      //   await instance2.respondToChallenge({from: users_in_group[1]});
      // } catch (error) {
      //     Error = error;
      // }
      // assert.notEqual(Error, undefined, 'Error must be thrown');
      // assert.isAbove(Error.message.search("You dont belong to the group anymore"), -1, "Require #2 Failed");

      // ----------------------REQUIRE #3--------------------------
      let instance3 = await KofNMultisig.new(users_in_group, _k);
      try {
        await instance3.respondToChallenge({from: users_in_group[0]});
      } catch (error) {
          Error = error;
      }
      assert.notEqual(Error, undefined, 'Error must be thrown');
      assert.isAbove(Error.message.search("There is no challenge"), -1, "Require #3 Failed");

      // ----------------------REQUIRE #4--------------------------
      let instance4 = await KofNMultisig.new(users_in_group, _k);
      // Good challenge
      await instance4.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});

      try {
        await instance4.respondToChallenge({from: users_in_group[2]});
      } catch (error) {
          Error = error;
      }
      assert.notEqual(Error, undefined, 'Error must be thrown');
      assert.isAbove(Error.message.search("You are not the target of the challenge. You cant respond to it"), -1, "Require #4 Failed");


        // ----------------------FUNCTION TEST--------------------------
        let instance5 = await KofNMultisig.new(users_in_group, _k);

        // transfer ether to the contract
        web3.eth.sendTransaction({from:web3.eth.accounts[0] , to:instance5.address, value: web3.toWei(1, 'ether'), gasLimit: 21000, gasPrice: 20000000000})

        var init_K = await instance5.getK();
        //transfer ether
        var init_balance = await instance5.getBalance();
        // console.log('init balance: %d',init_balance);
        await instance5.sendChallenge(users_in_group[1], {value: valid_penalty, from: users_in_group[0]});
        res = await instance5.getBalance();
        // assert.equal(res, init_balance+valid_penalty, "invalid penalty transfer in SendChallenge");

        res = await instance5.getChallengeTarget();
        assert.equal(res, users_in_group[1], "challenge.target is invalid");

        res = await instance5.getChallengeIsActive();
        assert.equal(res, true, "challenge.isActive is invalid");

        waitNBlocks(5);
        await instance5.respondToChallenge({from: users_in_group[1]});

        res = await instance5.getUserChallenged(users_in_group[1]);
        assert.equal(res, false, "user.challenged is invalid");

        res = await instance5.getChallengeIsActive();
        assert.equal(res, false, "challenge.isActive is invalid");

        res = await instance5.getK();
        assert.equal(res.toString(), init_K.toString(), "wrong value of K");

        res = await instance5.getBalance();
        // assert.equal(res, init_balance, "invalid penalty transfer");

      });



});
