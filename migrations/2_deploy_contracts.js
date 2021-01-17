const SlmToken = artifacts.require('SlmToken');
const { initialSupply } = require('../test/util.js')(web3);

module.exports = async function(deployer, _network, accounts) {
  await deployer.deploy(SlmToken, 'SolomonDefi', 'SLM', initialSupply, accounts[0]);
};
