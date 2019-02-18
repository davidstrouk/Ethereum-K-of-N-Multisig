<template>
  <div>
    <h1>K-of-N-Multisig Wallet</h1>
    <div v-if="web3.isInjected">
      <metamask-data></metamask-data>
      <KofNMultisig-component></KofNMultisig-component>
    </div>
    <div v-else>
      Please connect to your Metamask account.
    </div>
  </div>
</template>
<script>
import MetamaskData from './metamask-data'
import KofNMultisigComponent from './KofNMultisig-component'

export default {
 name: 'k-of-n-dapp',
 beforeCreate () {
    this.$store.dispatch('registerWeb3').then(() => {});
  },
  computed: {
    web3() {
      return this.$store.state.web3;
    }
  },
 components: {
 'metamask-data': MetamaskData,
 'KofNMultisig-component': KofNMultisigComponent
 }
}
</script>
<style scoped>
</style>
