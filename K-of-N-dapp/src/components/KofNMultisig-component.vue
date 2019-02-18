<template>
  <div class="KofNMultisig">
    <div>
      <h4>
        Shared Wallet Details:
      </h4>
      <p>Balance: {{ fromWeitoEther(this.balance) }}</p>
      <p>N: {{ this.N }}</p>
      <p>K: {{ this.K }}</p>
      <br/>
      <div v-if="challengeIsActive">
        There is an active challenge.
      </div>
      <div v-else>
        There is NO active challenge.
      </div>
      <div v-if="userInGroup">
        <b-row>
          <b-col>
            <b-form-select v-model="selectedTarget" :options="usersList" class="mb-3"/>
          </b-col>
          <b-col>
            <b-button v-if="userIsBlockedFromSendingChallenge" disabled>Send Challenge</b-button>
            <b-button v-else v-on:click="sendChallenge">Send Challenge</b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-button v-if="challengeIsActive" v-on:click="respondToChallenge">Respond to challenge</b-button>
            <b-button v-else disabled>Respond to challenge</b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-button v-if="challengeIsActive" v-on:click="tryToRemoveChallengedUser">Try to remove challenged user
            </b-button>
            <b-button v-else disabled>Try to remove challenged user</b-button>
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
                          placeholder="Amount to send (in ether)"></b-form-input>
          </b-col>
          <b-col>
            <b-button v-on:click="requestPayment">Request Payment</b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-select :options="transactionsList" v-model="approvePaymentTxId"></b-form-select>
          </b-col>
          <b-col>
            <b-button v-if="transactionsList.length > 0" v-on:click="approvePayment">Approve Payment</b-button>
            <b-button v-else disabled>Approve Payment</b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-table ref="table" striped hover
                     :sort-by="transactionsTableSortBy"
                     :sort-desc="transactionsTableSortDesc"
                     :fields="fields"
                     :items="transactionsTable"></b-table>
          </b-col>
        </b-row>
      </div>
      <div class="error" v-else>
        You don't belong to the group
      </div>
      <img v-if="pending" id="loader" src="https://loading.io/spinners/double-ring/lg.double-ring-spinner.gif">
      <div class="event" v-if="sendChallengeEvent">
        Challenge has been sent to target {{ sendChallengeEvent.target }}
      </div>
      <div class="event" v-if="respondToChallengeEvent">
        Challenge has been responded
      </div>
      <div class="event" v-if="userRemovedEvent">
        User {{ userRemovedEvent.removed_user }} has been removed from group. N = {{ userRemovedEvent.N }}, K = {{
        userRemovedEvent.K }}
      </div>
      <div class="event" v-if="userNotRemovedEvent">
        User {{ userNotRemovedEvent.not_removed_user }} has not been removed from group since time has not passed.
      </div>
      <div class="event" v-if="paymentRequestedEvent">
        Payment to {{paymentRequestedEvent.receiver}} of amount {{paymentRequestedEvent.amount}} has been requested.
        Transaction id: {{paymentRequestedEvent.txId}}
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
  </div>
</template>

<script>
  import getTransactionReceiptMined from "../util/getTransactionReceiptMined";

  const BLOCKS_TO_BLOCK = 50;
  const PENALTY_IN_ETHER = 0.1;
  const GAS_LIMIT = 3000000;

  export default {
    name: 'KofNMultisig',
    data() {
      return {
        balance: null,
        N: null,
        K: null,

        challengeIsActive: false,

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
        requestPaymentFailed: false,
        approvePaymentFailed: false,

        selectedTarget: null,
        requestPaymentReceiver: null,
        requestPaymentAmount: null,

        approvePaymentTxId: null,

        activeUsersList: [
          {value: null, text: 'Please select a user'},
        ],
        fields: [],
        transactionsTable: [],
        transactionsTableSortBy: "ID",
        transactionsTableSortDesc: false,

        usersList: [],
        transactionsList: [],
        userInGroup: true,
        numberOfTransactions: null,
        lastChallengeBlock: 0,
        pending: false
      }
    },
    watch: {
      numberOfTransactions: function () {
        this.updateUsersList();
      },
      usersList: function () {
        this.updateTransactionsTable();
      },
      transactionsTable: function () {
        this.$refs.table.refresh();
      },
      balance: function () {
        this.updateTransactionsList();
      }
    },
    mounted() {
      this.$store.dispatch('getContractInstance').then(() => {
        this.updateData();
      });
    },
    computed: {
      userIsBlockedFromSendingChallenge() {
        return this.lastChallengeBlock !== 0 && this.$store.state.web3.eth.blockNumber - this.lastChallengeBlock < BLOCKS_TO_BLOCK;
      }
    },
    methods: {
      updateData() {
        this.updateN();
        this.updateK();
        this.updateSharedWalletBalance();
        this.updateNumberOfTransactions();
        this.updateChallengeIsActive();
      },

      updateN() {
        this.$store.state.contractInstance().getN({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, N) => {
          this.N = parseInt(N);
        });
      },
      updateK() {
        this.$store.state.contractInstance().getK({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, K) => {
          this.K = parseInt(K);
        });
      },
      updateSharedWalletBalance() {
        this.$store.state.contractInstance().getBalance({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, balance) => {
          this.balance = parseInt(balance);
        });
      },
      updateUserInGroup() {
        this.$store.state.contractInstance().getUserInGroup(this.$store.state.web3.coinbase, {
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, inGroup) => {
          this.userInGroup = inGroup;
        });
      },
      updateTransactionsList() {
        this.$store.state.contractInstance().getNumberOfTransactions({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, number_of_transactions) => {
          let numberOfTransactions = parseInt(number_of_transactions);
          for (let i = 1; i <= numberOfTransactions; i++) {
            this.$store.state.contractInstance().getTransactionCount(i, {
              gas: GAS_LIMIT,
              from: this.$store.state.web3.coinbase
            }, (err, count) => {
              let transactionCount = parseInt(count);
              this.$store.state.contractInstance().getTransactionAmountToTransfer(i, {
                gas: GAS_LIMIT,
                from: this.$store.state.web3.coinbase
              }, (err, amount_to_transfer) => {
                if (((!this.challengeIsActive && this.balance >= parseInt(amount_to_transfer))
                  || (this.challengeIsActive && this.balance >= parseInt(amount_to_transfer) + this.$store.state.web3.web3Instance().toWei(PENALTY_IN_ETHER, 'ether')))
                  && (transactionCount < this.K)) {
                  this.transactionsList.push(i);
                }
              });
            });
          }
        });
      },
      updateTransactionsTable() {
        this.fields = [];
        this.fields.push("ID");
        this.fields.push("address");
        this.fields.push("amount");
        this.fields.push("count");

        for (let i = 1; i <= this.usersList.length; i++) {
          this.fields.push("user_" + i);
        }

        this.transactionsTable = [];
        for (let i = 1; i <= this.numberOfTransactions; i++) {
          let promises = [];
          let transactionRow = {"ID": i};

          promises.push(
            new Promise((resolve, reject) => {
              this.$store.state.contractInstance().getTransactionReceiver(i, {
                gas: GAS_LIMIT,
                from: this.$store.state.web3.coinbase
              }, (err, receiver) => {
                transactionRow["address"] = receiver;
                if (err) {
                  reject(err);
                }
                if (receiver) {
                  resolve(receiver);
                }
              })
            })
          );

          promises.push(
            new Promise((resolve, reject) => {
              this.$store.state.contractInstance().getTransactionAmountToTransfer(i, {
                gas: GAS_LIMIT,
                from: this.$store.state.web3.coinbase
              }, (err, amount_to_transfer) => {
                transactionRow["amount"] = this.fromWeitoEther(parseInt(amount_to_transfer));
                if (err) {
                  reject(err);
                }
                if (amount_to_transfer) {
                  resolve(amount_to_transfer);
                }
              })
            })
          );

          promises.push(
            new Promise((resolve, reject) => {
              this.$store.state.contractInstance().getTransactionCount(i, {
                gas: GAS_LIMIT,
                from: this.$store.state.web3.coinbase
              }, (err, count) => {
                transactionRow["count"] = parseInt(count);
                if (transactionRow["count"] === this.K) {
                  transactionRow["_rowVariant"] = "success";
                }
                if (err) {
                  reject(err);
                }
                if (count) {
                  resolve(count);
                }
              })
            })
          );

          for (let j = 1; j <= this.usersList.length; j++) {
            promises.push(
              new Promise((resolve, reject) => {
                this.$store.state.contractInstance().getTransactionUsersApprove(i, this.usersList[j - 1], {
                  gas: GAS_LIMIT,
                  from: this.$store.state.web3.coinbase
                }, (err, approved) => {
                  transactionRow['user_' + j] = approved ? "V" : "X";
                  if (err) {
                    reject(err);
                  }
                  resolve(approved);
                })
              })
            );
          }

          Promise.all(promises).then(values => {
            this.transactionsTable.push(transactionRow);
          });
        }
      },
      updateChallengeIsActive() {
        this.$store.state.contractInstance().getChallengeIsActive({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, challengeIsActive) => {
          this.challengeIsActive = challengeIsActive;
        });
      },
      updateLastChallengeBlock() {
        this.$store.state.contractInstance().getUserLastChallengeBlock(this.$store.state.web3.coinbase, {
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, lastChallengeBlock) => {
          this.lastChallengeBlock = lastChallengeBlock;
        });
      },
      updateNumberOfTransactions() {
        this.$store.state.contractInstance().getNumberOfTransactions({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, number_of_transactions) => {
          this.numberOfTransactions = parseInt(number_of_transactions);
        });
      },

      updateUsersList() {
        this.$store.state.contractInstance().getUsersWallets({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, wallets) => {
          this.usersList = wallets;
          this.updateActiveUsersList();
        });
      },

      updateActiveUsersList() {
        this.activeUsersList = [];
        this.activeUsersList.push({value: null, text: 'Please select a user'});

        for (let i = 0; i < this.usersList.length; i++) {
          this.$store.state.contractInstance().getUserInGroup(this.usersList[i], {
            gas: GAS_LIMIT,
            from: this.$store.state.web3.coinbase
          }, (err, inGroup) => {
            if (inGroup) {
              this.activeUsersList.push({value: this.usersList[i], text: this.usersList[i]});
            }
          });
        }

      },

      sendChallenge(event) {
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
                console.log("could not get event ChallengeSent()");
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
                this.updateChallengeIsActive();
                this.updateLastChallengeBlock();
                console.log("Execution was successful");
              }
            });
          }
        });
      },
      respondToChallenge(event) {
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
                this.updateChallengeIsActive();
                console.log("Execution was successful");
              }
            });
          }
        })
      },
      tryToRemoveChallengedUser(event) {
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
                this.updateChallengeIsActive();
                console.log("Execution was successful");
              }
            });
          }
        })
      },
      requestPayment(event) {
        console.log("requestPayment()");
        this.paymentRequestedEvent = null;
        this.paymentApprovedEvent = null;
        this.paymentTransferredEvent = null;

        this.pending = true;
        this.$store.state.contractInstance().requestPayment(this.$store.state.web3.web3Instance().toWei(this.requestPaymentAmount, "ether"), this.requestPaymentReceiver, {
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
                this.updateTransactionsList();
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
                this.requestPaymentFailed = true;
                this.pending = false;
                console.log("The contract execution was not successful, check your transaction !");
              } else {
                console.log("Execution was successful");
              }
            });
          }
        })
      },
      approvePayment(event) {
        this.paymentApprovedEvent = null;
        this.paymentTransferredEvent = null;

        this.pending = true;
        this.$store.state.contractInstance().approvePayment(this.approvePaymentTxId, {
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, result) => {
          if (err) {
            console.log(err);
            this.pending = false
          } else {
            let PaymentApproved = this.$store.state.contractInstance().PaymentApproved();
            PaymentApproved.watch((err, result) => {
              if (err) {
                console.log('could not get event PaymentApproved()')
              } else {
                console.log("PaymentApproved event has been received");
                this.paymentApprovedEvent = result.args;
                this.updateTransactionsList();
                this.updateTransactionsTable();
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
                this.approvePaymentFailed = true;
                this.pending = false;
                console.log("The contract execution was not successful, check your transaction !");
              } else {
                console.log("Execution was successful");
              }
            });
          }
        })
      },
      fromWeitoEther(wei) {
        return this.$store.state.web3.web3Instance().fromWei(wei, 'ether');
      }
    }
  }
</script>
<style scoped>
  .error {
    color: red;
    font-size: large;
  }
</style>
