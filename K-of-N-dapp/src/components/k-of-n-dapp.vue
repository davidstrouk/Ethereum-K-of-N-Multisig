<template>
  <div class="ml-3">
    <h1>K-of-N-Multisig Wallet</h1>
    <div v-if="web3.isInjected">
      <metamask-data></metamask-data>
      <MultisigWallet></MultisigWallet>
      <KofNMultisig></KofNMultisig>
    </div>
    <div v-else>
      Please connect to your Metamask account.
    </div>
  </div>
</template>
<script>
  import MetamaskData from './metamask-data';
  import KofNMultisig from './KofNMultisig';
  import MultisigWallet from './MultisigWallet';

  export default {
    name: 'k-of-n-dapp',
    beforeCreate() {
      this.$store.dispatch('registerWeb3').then(() => {
      });
    },
    computed: {
      web3() {
        return this.$store.state.web3;
      }
    },
    components: {
      'metamask-data': MetamaskData,
      'KofNMultisig': KofNMultisig,
      'MultisigWallet': MultisigWallet
    }
  }
</script>
<style scoped>
</style>
