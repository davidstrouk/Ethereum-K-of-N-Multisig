<template>
  <div>
    <div>
      <h4>
        User Wallet Details:
      </h4>
    </div>
    <div v-if="web3.isInjected" class="metamask-info">
      <p>Account: {{ web3.coinbase }}</p>
      <p>Balance: {{ web3.balance }}</p>
    </div>
    <div v-else>
      Please connect to your Metamask account.
    </div>
  </div>
</template>
<script>
  export default {
    name: 'metamask-data',
    computed: {
      web3() {
        return this.$store.state.web3;
      }
    },
    // mounted() {
    //   console.log(web3().isInjected);
    // }
  }
</script>
<style scoped>
</style>
