<template>
 <metamask-data/>
</template>
<script>
import MetamaskData from '@/components/metamask-data'
export default {
 name: 'k-of-n-dapp',
 beforeCreate () {
  console.log('registerWeb3 Action dispatched from k-of-n-dapp.vue')
  this.$store.dispatch('registerWeb3')
  },
 components: {
 'metamask-data': MetamaskData
 }
}
</script>
<style scoped>
</style>
