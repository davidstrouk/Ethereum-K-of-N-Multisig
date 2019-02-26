<template>
  <div class="KofNMultisig">
    <div>
      <b-row>
        <b-col cols="8">
          <h4>
            Shared Wallet Details:
          </h4>
          <p>Contract address: {{ getContractAddress() }}</p>
          <p>Balance: {{ fromWeitoEther(balance) }} ether</p>
          <p>Members in the group: {{ N }}</p>
        </b-col>
        <b-col cols="4">
          <img v-if="pending" id="loader" src="../assets/loading.svg">
        </b-col>
      </b-row>
      <br>
      <div v-if="userInGroup">
        <p>To make a transfer, you need approval of {{ K }} members out of {{ N }}.</p>
        <br/>
        <div v-show="challengeIsActive" style="color: red;">
          There is an active challenge right now.
          <div v-if="getCurrentBlocksToRespond > 0">
            <br>Please wait until it has been answered or time has passed for sending a new one.
            <br>Remaining blocks for response : {{ getCurrentBlocksToRespond }}
          </div>
          <div v-else>
            Challenged user has not responded to challenge.
            <br>You can now remove him from group by pressing "Try To Remove Challenged User" button.
          </div>
        </div>
        <div v-show="!challengeIsActive" style="color: blue;">
          There is no active challenge right now.
          <br>Sending a challenge is possible.
        </div>
        <br>
        <b-row>
          <b-col cols="4">
            <b-form-select v-model="selectedTarget" :options="activeUsersList"/>
          </b-col>
          <b-col cols="2"></b-col>
          <b-col cols="6">
            <b-button v-if="userIsBlockedFromSendingChallenge" disabled>Send Challenge</b-button>
            <b-button v-else v-on:click="sendChallenge">Send Challenge</b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b>
              <u>Notice:</u>
              when sending a challenge, you will have to pay a fee of {{ fromWeitoEther(penalty/2) }} ether
            </b>
          </b-col>
        </b-row>
        <br>
        <b-row>
          <b-col cols="4"></b-col>
          <b-col cols="2"></b-col>
          <b-col cols="6">
            <b-button v-if="challengeIsActive" v-on:click="respondToChallenge">Respond to challenge</b-button>
            <b-button v-else disabled>Respond to challenge</b-button>
          </b-col>
        </b-row>
        <br>
        <b-row>
          <b-col cols="4"></b-col>
          <b-col cols="2"></b-col>
          <b-col cols="6">
            <b-button v-if="challengeIsActive" v-on:click="tryToRemoveChallengedUser">Try to remove challenged user
            </b-button>
            <b-button v-else disabled>Try to remove challenged user</b-button>
          </b-col>
        </b-row>
        <br>
        <hr>
        <br>
        <b-row>
          <b-col cols="4">
            <b-form-input v-model="requestPaymentReceiver"
                          type="text"
                          placeholder="Receiver's address"></b-form-input>
          </b-col>
          <b-col cols="2">
            <b-form-input v-model="requestPaymentAmount"
                          type="number"
                          placeholder="Amount (in ether)"></b-form-input>
          </b-col>
          <b-col cols="6">
            <b-button v-on:click="requestPayment">Request Payment</b-button>
          </b-col>
        </b-row>
        <br>
        <b-row>
          <b-col cols="4">
            <b-form-select :options="transactionsList" v-model="approvePaymentTxId"></b-form-select>
          </b-col>
          <b-col cols="2"></b-col>
          <b-col cols="6">
            <b-button v-if="transactionsList.length > 0" v-on:click="approvePayment">Approve Payment</b-button>
            <b-button v-else disabled>Approve Payment</b-button>
          </b-col>
        </b-row>
        <br>
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
    </div>
  </div>
</template>

<script>
  import getTransactionReceiptMined from "../util/getTransactionReceiptMined";
  import {address} from "../util/constants/KofNMultisig";
  import * as _ from "underscore";

  const BLOCKS_TO_BLOCK = 20;
  const BLOCKS_TO_RESPOND = 10;
  const GAS_LIMIT = 3000000;

  export default {
    name: 'KofNMultisig',
    data() {
      return {
        balance: null,
        N: null,
        K: null,
        coinbase: null,
        currentBlockNumber: null,
        penalty: 0,

        challengeIsActive: false,
        challengeStartBlock: 0,

        sendChallengeEvent: null,
        respondToChallengeEvent: null,
        userRemovedEvent: null,
        userNotRemovedEvent: null,
        paymentRequestedEvent: null,
        paymentApprovedEvent: null,
        paymentTransferredEvent: null,

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
      // numberOfTransactions: function () {
      //   this.updateUsersList();
      // },
      usersList: function () {
        this.updateTransactionsTable();
      },
      transactionsTable: function () {
        // if (this.transactionsTable) {
        //   this.$refs.table.refresh();
        // }
      },
      balance: function () {
        this.updateTransactionsList();
      }
    },
    mounted() {
      this.$store.dispatch('getContractInstance').then(() => {
      });

      let accountInterval = setInterval(function () {
        if (this.web3.coinbase !== this.coinbase) {
          this.coinbase = this.web3.coinbase;
          this.updateData();
        }
      }.bind(this), 100);

      setInterval(function () {
        this.$store.state.web3.web3Instance().eth.getBlockNumber((error, result) => {
          this.currentBlockNumber = result;
        });
      }.bind(this), 1000);
    },
    computed: {
      userIsBlockedFromSendingChallenge() {
        return (this.lastChallengeBlock !== 0 && this.currentBlockNumber - this.lastChallengeBlock.toNumber() < BLOCKS_TO_BLOCK) || this.challengeIsActive;
      },
      getCurrentBlocksToRespond() {
        return this.challengeStartBlock !== 0 ? this.challengeStartBlock.toNumber() + this.getBlocksToRespond() - this.currentBlockNumber : 0;
      },
      web3() {
        return this.$store.state.web3;
      }
    },
    methods: {
      updateData() {
        this.updateN();
        this.updateK();
        this.updateSharedWalletBalance();
        this.updateNumberOfTransactions();
        this.updateChallengeIsActive();
        this.updateLastChallengeBlock();
        this.updateChallengeStartBlock();
        this.updateUserInGroup();
        this.updateUsersList();
        this.updatePenalty();
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
      updatePenalty() {
        this.$store.state.contractInstance().getPenalty({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, penalty) => {
          this.penalty = parseInt(penalty);
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
          this.transactionsList = [];
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
                  || (this.challengeIsActive && this.balance >= parseInt(amount_to_transfer) + this.penalty))
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
                if (err) {
                  reject(err);
                }
                if (count) {
                  resolve(count);
                }
              })
            })
          );

          promises.push(
            new Promise((resolve, reject) => {
              this.$store.state.contractInstance().getTransactionTransferred(i, {
                gas: GAS_LIMIT,
                from: this.$store.state.web3.coinbase
              }, (err, transferred) => {
                console.log("transferred = ", transferred);
                if (transferred) {
                  transactionRow["_rowVariant"] = "success";
                }
                if (err) {
                  reject(err);
                }
                resolve(transferred);
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
      updateChallengeStartBlock() {
        this.$store.state.contractInstance().getChallengeStartBlock({
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, challengeStartBlock) => {
          this.challengeStartBlock = challengeStartBlock;
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
              this.activeUsersList.push({
                value: this.usersList[i],
                text: `User ${this.getUserNumberFromAddress(this.usersList[i])}`
              });
            }
          });
        }

      },

      sendChallenge(event) {
        this.sendChallengeEvent = null;
        this.pending = true;
        let value = this.penalty/2 + 1000000000000;

        this.$store.state.contractInstance().sendChallenge(this.selectedTarget, {
          gas: GAS_LIMIT,
          value: value,
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
                if (this.sendChallengeEvent === null) {
                  this.sendChallengeEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'Challenge Sent',
                    text: this.getSendChallengeEventMessage(this.sendChallengeEvent),
                    type: "success",
                    duration: 10000,
                    width: "500"
                  });
                  this.updateChallengeIsActive();
                  this.updateUserInGroup();
                  this.updateLastChallengeBlock();
                  this.updateChallengeStartBlock();
                  this.pending = false;
                }
              }
            });

            getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
              console.log("data= ", data);
              if (data.status == '0x0') {
                this.$notify({
                  group: 'KofNMultisig',
                  title: 'Error',
                  text: "Challenge has not been sent.",
                  type: "error",
                  duration: 10000,
                  width: "500"
                });
                this.pending = false;
                console.log("The contract execution was not successful, check your transaction !");
              } else {
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
                if (this.respondToChallengeEvent === null) {
                  this.respondToChallengeEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'Challenge Responded',
                    text: this.getRespondToChallengeEventMessage(this.respondToChallengeEvent),
                    type: "success",
                    duration: 10000,
                    width: "500"
                  });
                  this.updateChallengeIsActive();
                  this.pending = false
                }
              }
            });

            getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
              if (data.status == '0x0') {
                this.$notify({
                  group: 'KofNMultisig',
                  title: 'Error',
                  text: "Challenge has not been responded.",
                  type: "error",
                  duration: 10000,
                  width: "500"
                });
                this.pending = false;
              } else {
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
                if (this.userRemovedEvent === null) {
                  this.userRemovedEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'User Removed',
                    text: this.getUserRemovedEventMessage(this.userRemovedEvent),
                    type: "success",
                    duration: 10000,
                    width: "500"
                  });
                  this.pending = false;
                  this.updateData();
                }
              }
            });

            let UserNotRemoved = this.$store.state.contractInstance().UserNotRemoved();
            UserNotRemoved.watch((err, result) => {
              if (err) {
                console.log('could not get event UserNotRemoved()')
              } else {
                if (this.userNotRemovedEvent === null) {
                  this.userNotRemovedEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'User Not Removed',
                    text: this.getUserNotRemovedEventMessage(this.userNotRemovedEvent),
                    type: "warn",
                    duration: 10000,
                    width: "500"
                  });
                  this.updateChallengeIsActive();
                  this.pending = false
                }
              }
            });

            getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
              if (data.status == '0x0') {
                this.$notify({
                  group: 'KofNMultisig',
                  title: 'Error',
                  text: "User has not been removed.",
                  type: "error",
                  duration: 10000,
                  width: "500"
                });
                this.pending = false;
                console.log("The contract execution was not successful, check your transaction !");
              } else {
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
                if (this.paymentRequestedEvent === null) {
                  this.paymentRequestedEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'Payment Requested',
                    text: this.getPaymentRequestedEventMessage(this.paymentRequestedEvent),
                    type: "success",
                    duration: 10000,
                    width: "500"
                  });
                  this.$store.state.contractInstance().getNumberOfTransactions({
                    gas: GAS_LIMIT,
                    from: this.$store.state.web3.coinbase
                  }, (err, number_of_transactions) => {
                    this.numberOfTransactions = parseInt(number_of_transactions);
                    this.updateTransactionsList();
                    this.updateTransactionsTable();
                  });
                  this.pending = false;
                }
              }
            });

            let PaymentApproved = this.$store.state.contractInstance().PaymentApproved();
            PaymentApproved.watch((err, result) => {
              if (err) {
                console.log('could not get event PaymentApproved()')
              } else {
                if (this.paymentApprovedEvent === null) {
                  this.paymentApprovedEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'Payment Approved',
                    text: this.getPaymentApprovedEventMessage(this.paymentApprovedEvent),
                    type: "success",
                    duration: 10000,
                    width: "500"
                  });
                  this.pending = false
                }
              }
            });

            let PaymentTransferred = this.$store.state.contractInstance().PaymentTransferred();
            PaymentTransferred.watch((err, result) => {
              if (err) {
                console.log('could not get event PaymentTransferred()')
              } else {
                if (this.paymentTransferredEvent === null) {
                  this.paymentTransferredEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'Payment Transferred',
                    text: this.getPaymentTransferredEventMessage(this.paymentTransferredEvent),
                    type: "success",
                    duration: 10000,
                    width: "500"
                  });
                  this.pending = false;
                }
              }
            });

            getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
              if (data.status == '0x0') {
                this.$notify({
                  group: 'KofNMultisig',
                  title: 'Error',
                  text: "Payment has not been requested.",
                  type: "error",
                  duration: 10000,
                  width: "500"
                });
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
                if (this.paymentApprovedEvent === null) {
                  this.paymentApprovedEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'Payment Approved',
                    text: this.getPaymentApprovedEventMessage(this.paymentApprovedEvent),
                    type: "success",
                    duration: 10000,
                    width: "500"
                  });
                  this.updateTransactionsList();
                  this.updateTransactionsTable();
                  this.pending = false;
                }
              }
            });

            let PaymentTransferred = this.$store.state.contractInstance().PaymentTransferred();
            PaymentTransferred.watch((err, result) => {
              if (err) {
                console.log('could not get event PaymentTransferred()')
              } else {
                if (this.paymentTransferredEvent === null) {
                  this.paymentTransferredEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'Payment Transferred',
                    text: this.getPaymentTransferredEventMessage(this.paymentTransferredEvent),
                    type: "success",
                    duration: 10000,
                    width: "500"
                  });
                  this.pending = false;
                }
              }
            });

            getTransactionReceiptMined(this.$store.state.web3.web3Instance().eth, result).then(data => {
              if (data.status == '0x0') {
                this.$notify({
                  group: 'KofNMultisig',
                  title: 'Error',
                  text: "Payment has not been approved.",
                  type: "error",
                  duration: 10000,
                  width: "500"
                });
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
      },
      getSendChallengeEventMessage(sendChallengeEvent) {
        return `Challenge has been sent to target ${sendChallengeEvent.target}`;
      },
      getPaymentRequestedEventMessage(paymentRequestedEvent) {
        return `Payment to ${paymentRequestedEvent.receiver} of amount ${this.fromWeitoEther(paymentRequestedEvent.amount_to_transfer)} has been requested.\n
          Transaction id: ${paymentRequestedEvent.txId}`;
      },
      getRespondToChallengeEventMessage(challengeRespondedEvent) {
        return `Challenge has been responded`;
      },
      getUserRemovedEventMessage(userRemovedEvent) {
        return `User ${userRemovedEvent.removed_user} has been removed from group. N = ${userRemovedEvent.N}, K = ${userRemovedEvent.K}`
      },
      getUserNotRemovedEventMessage(userNotRemovedEvent) {
        return `User ${userNotRemovedEvent.not_removed_user} has not been removed from group since time has not passed.`;
      },
      getPaymentApprovedEventMessage(paymentApprovedEvent) {
        return `Transaction number ${paymentApprovedEvent.txId} has been approved.`;
      },
      getPaymentTransferredEventMessage(paymentTransferredEvent) {
        return `Transaction number ${paymentTransferredEvent.txId} has been transferred.`;
      },
      getContractAddress() {
        return address;
      },
      getBlocksToRespond() {
        return BLOCKS_TO_RESPOND;
      },
      getUserNumberFromAddress(address) {
        return _.indexOf(this.usersList, address) + 1;
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
