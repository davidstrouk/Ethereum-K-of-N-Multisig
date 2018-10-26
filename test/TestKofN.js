var KofNMultisig = artifacts.require("KofNMultisig");

var user_not_in_group = 0x9cEECBB913801F15C845C97454d9C92b4033160C;

contract('KofNMultisig Javascript Test', async (accounts) => {

  it("Require #1", async () => {
    var price = 100000000000000000; //0.1 ether

    let instance = await KofNMultisig.deployed();
    try {
     await instance.sendChallenge(user_not_in_group, {value: price, from: 0x9cEECBB913801F15C845C97454d9C92b4033160C});
    } catch (error) {
        var Error = error;
    }
        console.log(Error.message);
        assert.notEqual(Error, undefined, 'Error must be thrown');
        assert.isAbove(Error.message.search("You dont belong to the group"), -1, "Require #1 Failed");
    });

  it("Require #4", async () => {
    var account = accounts[0];
    var price = 100000000000000000; //0.1 ether

    let instance = await KofNMultisig.deployed();
    try {
     await instance.sendChallenge(user_not_in_group, {value: price, from: account});
    } catch (error) {
        var Error = error;
    }
        assert.notEqual(Error, undefined, 'Error must be thrown');
        assert.isAbove(Error.message.search("Your target doesnt belong to the group"), -1, "Require #4 Failed");
    });
  });
