<template>
  <div class="KofNMultisig">
    <div>
      <p>Amount: {{ this.amount }}</p>
      <p>N: {{ this.N }}</p>
      <p>K: {{ this.K }}</p>
      <br/>
      <p v-on:click="sendChallenge">Send challenge</p>
    </div>
    <img v-if="pending" id="loader" src="https://loading.io/spinners/double-ring/lg.double-ring-spinner.gif">
    <div class="event" v-if="sendChallengeEvent">
      Won: {{ sendChallengeEvent._status }}
      Amount: {{ sendChallengeEvent._amount }} Wei
    </div>
  </div>
</template>

<script>

  const PENALTY_IN_ETHER = 0.1;

export default {
 name: 'KofNMultisig',
 data () {
   return {
    amount: null,
    N: null,
    K: null,
    isChallenge: false,

    sendChallengeEvent: null,
    pending: false
   }
 },
 mounted () {
  console.log('dispatching getContractInstance');
  this.$store.dispatch('getContractInstance');
 },
  methods: {
    sendChallenge (event) {
      console.log("sendChallenge(", "0xdE9d4F3c10a5242EB8885502a609dfCa33ce5fdF", ") with value ", PENALTY_IN_ETHER);
      this.sendChallengeEvent = null;
      this.pending = true;
      this.$store.state.contractInstance().sendChallenge("0xdE9d4F3c10a5242EB8885502a609dfCa33ce5fdF", {
        gas: 300000,
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
              this.sendChallengeEvent = result.args;
              this.pending = false
            }
          })
        }
      })
    }
  },
}
</script>
<style scoped>

</style>
