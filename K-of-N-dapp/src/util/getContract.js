import Web3 from 'web3';
import {address, ABI} from './constants/KofNMultisig';
import {factoryAddress, factoryABI} from './constants/MultisigWallet';

let getContract = new Promise(function (resolve, reject) {
 let web3 = new Web3(window.web3.currentProvider);
 let KofNMultisigContract = web3.eth.contract(ABI);
 let KofNMultisigContractInstance = KofNMultisigContract.at(address);
 resolve(KofNMultisigContractInstance);
});

let getFactoryContract = new Promise(function (resolve, reject) {
  let web3 = new Web3(window.web3.currentProvider);
  let MultisigWalletContract = web3.eth.contract(factoryABI);
  let MultisigWalletContractInstance = MultisigWalletContract.at(factoryAddress);
  resolve(MultisigWalletContractInstance);
});

export {
  getContract,
  getFactoryContract
}
