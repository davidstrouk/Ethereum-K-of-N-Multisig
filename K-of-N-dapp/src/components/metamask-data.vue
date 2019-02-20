<template>
  <div>
    <div>
      <h4>
        User Wallet Details:
      </h4>
    </div>
    <div class="metamask-info">
      <p>Account: {{ web3.coinbase }}</p>
      <p>Balance: {{ fromWeitoEther(web3.balance) }} ether</p>
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
    methods: {
      fromWeitoEther(wei) {
        return this.$store.state.web3.web3Instance().fromWei(wei, 'ether');
      }
    }
  }
</script>
<style scoped>
</style>
