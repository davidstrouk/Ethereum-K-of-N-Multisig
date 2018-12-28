<template>
  <div>
    <metamask-data/>
    <KofNMultisig-component/>
  </div>
</template>
<script>
import MetamaskData from '@/components/metamask-data'
import KofNMultisigComponent from '@/components/KofNMultisig-component'

export default {
 name: 'k-of-n-dapp',
 beforeCreate () {
    console.log('registerWeb3 Action dispatched from k-of-n-dapp.vue')
    this.$store.dispatch('registerWeb3')
  },
 components: {
 'metamask-data': MetamaskData,
 'KofNMultisig-component': KofNMultisigComponent
 }
}
</script>
<style scoped>
</style>
