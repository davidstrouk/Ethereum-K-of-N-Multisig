<template>
  <div>
    <h1>K-of-N-Multisig Wallet</h1>
    <metamask-data></metamask-data>
    <KofNMultisig-component></KofNMultisig-component>
  </div>
</template>
<script>
import MetamaskData from './metamask-data'
import KofNMultisigComponent from './KofNMultisig-component'

export default {
 name: 'k-of-n-dapp',
 beforeCreate () {
    console.log('registerWeb3 Action dispatched from k-of-n-dapp.vue');
    this.$store.dispatch('registerWeb3').then(() => {});
  },
 components: {
 'metamask-data': MetamaskData,
 'KofNMultisig-component': KofNMultisigComponent
 }
}
</script>
<style scoped>
</style>
