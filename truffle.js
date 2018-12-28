module.exports = {
	networks: {
		development: {
			host: "localhost",
			port: 7545,
			network_id: "*",
			gasPrice: 1,
			gas: 6600000
		}
	},
	compilers: {
		solc: {
			version: "0.4.24",
		}
	}
};
