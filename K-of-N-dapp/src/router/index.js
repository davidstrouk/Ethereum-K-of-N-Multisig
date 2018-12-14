import Vue from 'vue'
import Router from 'vue-router'
import KofNDapp from '@/components/k-of-n-dapp'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'k-of-n-dapp',
      component: KofNDapp
    }
  ]
})
