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
      <b-row>
        <b-col>
          <b-button v-on:click="respondToChallenge">Respond to challenge</b-button>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-button v-on:click="tryToRemoveChallengedUser">Try to remove challenged user</b-button>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-form-input v-model="requestPaymentReceiver"
                        type="text"
                        placeholder="Receiver's address"></b-form-input>
        </b-col>
        <b-col>
          <b-form-input v-model="requestPaymentAmount"
                        type="number"
                        placeholder="Amount to send (in wei)"></b-form-input>
        </b-col>
        <b-col>
          <b-button v-on:click="requestPayment">Request Payment</b-button>
        </b-col>
      </b-row>
    </div>
    <img v-if="pending" id="loader" src="https://loading.io/spinners/double-ring/lg.double-ring-spinner.gif">
    <div class="event" v-if="sendChallengeEvent">
      Challenge has been sent to target {{ sendChallengeEvent.target }}
    </div>
    <div class="event" v-if="respondToChallengeEvent">
      Challenge has been responded
    </div>
    <div class="event" v-if="userRemovedEvent">
      User {{ userRemovedEvent.removed_user }} has been removed from group. N = {{ userRemovedEvent.N }}, K = {{ userRemovedEvent.K }}
    </div>
    <div class="event" v-if="userNotRemovedEvent">
      User {{ userNotRemovedEvent.not_removed_user }} has not been removed from group since time has not passed.
    </div>
    <div class="event" v-if="paymentRequestedEvent">
      Payment to {{paymentRequestedEvent.receiver}} of amount {{paymentRequestedEvent.amount}} has been requested. Transaction id: {{paymentRequestedEvent.txId}}
    </div>
    <div class="event" v-if="paymentApprovedEvent">
      Transaction number {{ paymentApprovedEvent.txId }} has been approved.
    </div>
    <div class="event" v-if="paymentTransferredEvent">
      Transaction number {{ paymentTransferredEvent.txId }} has been transferred.
    </div>
    <div class="event" v-if="sendChallengeFailed">
      Error: Challenge has not been sent.
    </div>
    <div class="event" v-if="respondToChallengeFailed">
      Error: Challenge has not been responded.
    </div>
    <div class="event" v-if="tryToRemoveChallengedUserFailed">
      Error: User has not been removed.
    </div>
  </div>
</template>

<script>
  import getTransactionReceiptMined from "../util/getTransactionReceiptMined";

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
       userRemovedEvent: null,
       userNotRemovedEvent: null,
       paymentRequestedEvent: null,
       paymentApprovedEvent: null,
       paymentTransferredEvent: null,

       sendChallengeFailed: false,
       respondToChallengeFailed: false,
       tryToRemoveChallengedUserFailed: false,

       selectedTarget: null,
       requestPaymentReceiver: null,
       requestPaymentAmount: null,

       activeUsersList: [
         { value: null, text: 'Please select a user' },
       ],

       usersList: [],
       numberOfTransactions: null,
       pending: false
     }
 },
 mounted () {
  console.log('dispatching getContractInstance');
  this.$store.dispatch('getContractInstance').then(() => {
    this.updateNumberOfTransactions();
    this.updateUsersList();
    this.updateActiveUsersList()
  });
 },
  methods: {
    updateNumberOfTransactions() {
      this.$store.state.contractInstance().getNumberOfTransactions({
        gas: GAS_LIMIT,
        from: this.$store.state.web3.coinbase
      }, (err, number_of_transactions) => {
        this.numberOfTransactions = number_of_transactions;
      });
    },

    updateUsersList() {
      this.$store.state.contractInstance().getUsersWallets({
        gas: GAS_LIMIT,
        from: this.$store.state.web3.coinbase
      }, (err, wallets) => {
        this.usersList = wallets;
      });
    },

    updateActiveUsersList() {
      this.activeUsersList = [];
      this.activeUsersList.push({ value: null, text: 'Please select a user' });
      for(let i = 0; i < this.usersList.length; i++) {
        this.$store.state.contractInstance().getUserInGroup(this.usersList[i], {
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, inGroup) => {
          if(inGroup) {
            this.activeUsersList.push({ value: this.usersList[i], text: this.usersList[i] });
          }
        });
      }
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
          console.log("sendChallenge error: ", err);
          this.pending = false
        } else {
          console.log("sendChallenge result: ", result);
          let ChallengeSent = this.$store.state.contractInstance().ChallengeSent();
          ChallengeSent.watch((err, result) => {
            if (err) {
              console.log('could not get event ChallengeSent()')
            } else {
              console.log("ChallengeSent event has been received");
              this.sendChallengeEvent = result.args;
              this.pending = false
            }
          });

          getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
            console.log("data= ", data);
            if (data.status == '0x0') {
              this.sendChallengeFailed = true;
              this.pending = false;
              console.log("The contract execution was not successful, check your transaction !");
            } else {
              console.log("Execution was successful");
            }
          });
        }
      });
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
          });

          getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
            if (data.status == '0x0') {
              this.respondToChallengeFailed = true;
              this.pending = false;
              console.log("The contract execution was not successful, check your transaction !");
            } else {
              console.log("Execution was successful");
            }
          });
        }
      })
    },
    tryToRemoveChallengedUser (event) {
      console.log("tryToRemoveChallengedUser()");
      this.userRemovedEvent = null;
      this.userNotRemovedEvent = null;
      this.pending = true;
      this.$store.state.contractInstance().tryToRemoveChallengedUser({
        gas: GAS_LIMIT,
        from: this.$store.state.web3.coinbase
      }, (err, result) => {
        if (err) {
          console.log(err);
          this.pending = false
        } else {
          let UserRemoved = this.$store.state.contractInstance().UserRemoved();
          UserRemoved.watch((err, result) => {
            if (err) {
              console.log('could not get event UserRemoved()')
            } else {
              console.log("UserRemoved event has been received");
              this.userRemovedEvent = result.args;
              this.pending = false;
              this.updateActiveUsersList();
            }
          });

          let UserNotRemoved = this.$store.state.contractInstance().UserNotRemoved();
          UserNotRemoved.watch((err, result) => {
            if (err) {
              console.log('could not get event UserNotRemoved()')
            } else {
              console.log("UserNotRemoved event has been received");
              this.userNotRemovedEvent = result.args;
              this.pending = false
            }
          });

          getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
            if (data.status == '0x0') {
              this.tryToRemoveChallengedUserFailed = true;
              this.pending = false;
              console.log("The contract execution was not successful, check your transaction !");
            } else {
              console.log("Execution was successful");
            }
          });
        }
      })
    },
    requestPayment (event) {
      console.log("requestPayment()");
      this.paymentRequestedEvent = null;
      this.paymentApprovedEvent = null;
      this.paymentTransferredEvent = null;

      this.pending = true;
      this.$store.state.contractInstance().requestPayment(this.requestPaymentAmount, this.requestPaymentReceiver, {
        gas: GAS_LIMIT,
        from: this.$store.state.web3.coinbase
      }, (err, result) => {
        if (err) {
          console.log(err);
          this.pending = false
        } else {
          let PaymentRequested = this.$store.state.contractInstance().PaymentRequested();
          PaymentRequested.watch((err, result) => {
            if (err) {
              console.log('could not get event PaymentRequested()')
            } else {
              console.log("PaymentRequested event has been received");
              this.paymentRequestedEvent = result.args;
              this.updateNumberOfTransactions();
              this.pending = false;
            }
          });

          let PaymentApproved = this.$store.state.contractInstance().PaymentApproved();
          PaymentApproved.watch((err, result) => {
            if (err) {
              console.log('could not get event PaymentApproved()')
            } else {
              console.log("PaymentApproved event has been received");
              this.paymentApprovedEvent = result.args;
              this.pending = false
            }
          });

          let PaymentTransferred = this.$store.state.contractInstance().PaymentTransferred();
          PaymentTransferred.watch((err, result) => {
            if (err) {
              console.log('could not get event PaymentTransferred()')
            } else {
              console.log("PaymentTransferred event has been received");
              this.paymentTransferredEvent = result.args;
              this.pending = false
            }
          });

          getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
            if (data.status == '0x0') {
              this.tryToRemoveChallengedUserFailed = true;
              this.pending = false;
              console.log("The contract execution was not successful, check your transaction !");
            } else {
              console.log("Execution was successful");
            }
          });
        }
      })
    },
    approvePayment (event) {

    }
  }
}
</script>
<style scoped>

</style>
