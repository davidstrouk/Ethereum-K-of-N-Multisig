const factoryAddress = "0x75e9ce53d98c50964e6b49e164aca16ea5be9f9e";
const factoryABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "groups",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "wallets",
        "type": "address[]"
      },
      {
        "name": "K",
        "type": "uint256"
      }
    ],
    "name": "addGroup",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "newAddress",
        "type": "address"
      }
    ],
    "name": "ContractCreated",
    "type": "event"
  }
];

export {
  factoryAddress,
  factoryABI
};
