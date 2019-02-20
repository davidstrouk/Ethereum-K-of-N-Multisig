<template>
  <b-row>
    <b-col cols="4">
      <b-form-input v-model="usersListString"
                    type="text"
                    placeholder="Members of the group's address list"></b-form-input>
    </b-col>
    <b-col cols="2">
      <b-form-input v-model="K"
                    type="number"
                    placeholder="K"></b-form-input>
    </b-col>
    <b-col cols="6">
      <b-button v-on:click="addGroup">Create Shared Wallet</b-button>
    </b-col>
  </b-row>
</template>

<script>
  import getTransactionReceiptMined from "../util/getTransactionReceiptMined";

  const GAS_LIMIT = 3000000;

  export default {
    name: "MultisigWallet",

    data() {
      return {
        pending: false,

        usersListString: "",
        usersList: [],
        K: undefined,

        contractCreatedEvent: null
      }
    },

    methods: {
      addGroup(event) {
        this.contractCreatedEvent = null;
        this.pending = true;

        this.usersList = JSON.parse(this.usersListString);

        this.$store.state.factoryContractInstance().addGroup(this.usersList, this.K, {
          gas: GAS_LIMIT,
          from: this.$store.state.web3.coinbase
        }, (err, result) => {
          if (err) {
            console.log("error in AddGroup", err);
            this.pending = false
          } else {
            let ContractCreated = this.$store.state.factoryContractInstance().ContractCreated();
            ContractCreated.watch((err, result) => {
              if (err) {
                console.log('could not get event ContractCreated()')
              } else {
                if (this.contractCreatedEvent === null) {
                  this.contractCreatedEvent = result.args;
                  this.$notify({
                    group: 'KofNMultisig',
                    title: 'Contract Created',
                    text: this.getContractCreatedEventMessage(this.contractCreatedEvent),
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
                  text: "Contract has not been created.",
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

      getContractCreatedEventMessage(contractCreatedEvent) {
        return `A new shared wallet has been created at address ${contractCreatedEvent.newAddress}`;
      }
    },


    mounted() {
      this.$store.dispatch('getFactoryContractInstance').then(() => {
      });
    }
  }
</script>

<style scoped>

</style>
