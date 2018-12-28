import Web3 from 'web3'
import {address, ABI} from './constants/KofNMultisig'

let getContract = new Promise(function (resolve, reject) {
 let web3 = new Web3(window.web3.currentProvider);
 let KofNMultisigContract = web3.eth.contract(ABI);
 let KofNMultisigContractInstance = KofNMultisigContract.at(address);
 // KofNMultisigContractInstance = () => KofNMultisigContractInstance
 resolve(KofNMultisigContractInstance)
});

export default getContract
