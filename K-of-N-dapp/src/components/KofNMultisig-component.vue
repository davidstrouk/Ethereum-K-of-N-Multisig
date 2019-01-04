<template>
  <div class="KofNMultisig">
    <div>
      <p>Amount: {{ this.amount }}</p>
      <p>N: {{ this.N }}</p>
      <p>K: {{ this.K }}</p>
      <br/>
      <b-row>
        <b-col>
          <b-form-select v-model="selectedTarget" :options="usersList" class="mb-3" />
        </b-col>
        <b-col>
          <b-button v-on:click="sendChallenge">Send Challenge</b-button>
        </b-col>
      </b-row>
      <p v-on:click="respondToChallenge">Respond to challenge</p>
    </div>
    <img v-if="pending" id="loader" src="https://loading.io/spinners/double-ring/lg.double-ring-spinner.gif">
    <div class="event" v-if="sendChallengeEvent">
      Challenge has been sent to target {{ sendChallengeEvent.target }}
    </div>
    <div class="event" v-if="respondToChallengeEvent">
      Challenge has been responded
    </div>
  </div>
</template>

<script>

  const PENALTY_IN_ETHER = 0.1;
  const GAS_LIMIT = 3000000;

export default {
 name: 'KofNMultisig',
 data () {
   return {
     amount: null,
     N: null,
     K: null,

     isChallenge: false,

     sendChallengeEvent: null,
     respondToChallengeEvent: null,

     selectedTarget: null,
     usersList: [
       { value: null, text: 'Please select a user' },
     ],

     pending: false
   }
 },
 mounted () {
  console.log('dispatching getContractInstance');
  this.$store.dispatch('getContractInstance').then(() => this.updateUsersList());

 },
  methods: {
    updateUsersList() {
      this.$store.state.contractInstance().getUsersWallets({
        gas: 300000,
        from: this.$store.state.web3.coinbase
      }, (err, wallets) => {
        this.usersList = [];
        this.usersList.push({ value: null, text: 'Please select a user' });
        for(let i = 0; i < wallets.length; i++) {
          this.$store.state.contractInstance().getUserInGroup(wallets[i], {
            gas: 300000,
            from: this.$store.state.web3.coinbase
          }, (err, inGroup) => {
            if(inGroup) {
              this.usersList.push({ value: wallets[i], text: wallets[i] });
            }
          });
        }
      });
    },
    sendChallenge (event) {
      console.log("sendChallenge(", this.selectedTarget, ") with value ", PENALTY_IN_ETHER);
      this.sendChallengeEvent = null;
      this.pending = true;
      this.$store.state.contractInstance().sendChallenge(this.selectedTarget, {
        gas: GAS_LIMIT,
        value: this.$store.state.web3.web3Instance().toWei(PENALTY_IN_ETHER, 'ether'),
        from: this.$store.state.web3.coinbase
      }, (err, result) => {
        if (err) {
          console.log(err);
          this.pending = false
        } else {
          let ChallengeSent = this.$store.state.contractInstance().ChallengeSent();
          ChallengeSent.watch((err, result) => {
            if (err) {
              console.log('could not get event ChallengeSent()')
            } else {
              console.log("ChallengeSent event has been received");
              this.sendChallengeEvent = result.args;
              this.pending = false
            }
          })
        }
      })
    },
    respondToChallenge (event) {
      console.log("respondToChallenge()");
      this.respondToChallengeEvent = null;
      this.pending = true;
      this.$store.state.contractInstance().respondToChallenge({
        gas: GAS_LIMIT,
        from: this.$store.state.web3.coinbase
      }, (err, result) => {
        if (err) {
          console.log(err);
          this.pending = false
        } else {
          let ChallengeResponded = this.$store.state.contractInstance().ChallengeResponded();
          ChallengeResponded.watch((err, result) => {
            if (err) {
              console.log('could not get event ChallengeResponded()')
            } else {
              console.log("ChallengeResponded event has been received");
              this.respondToChallengeEvent = result.args;
              this.pending = false
            }
          })
        }
      })
    }
  }
}
</script>
<style scoped>

</style>
