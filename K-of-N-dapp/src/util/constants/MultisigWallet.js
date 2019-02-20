const factoryAddress = "0x7d90054d560f0c30bea487e85f6de499d062cb6e";
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
