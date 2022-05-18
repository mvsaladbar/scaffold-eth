const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { EMPTY_ADDRESS } = require("../utils/constants");
const { fork_network } = require("../utils/network_fork");

let owner;
let chainlinkOracleContract;

chai.use(solidity);
let expect = chai.expect;

describe("Chainlink Oracle", async () => {
  before(async () => {
    fork_network();
    [owner] = await ethers.getSigners();
    await mockContracts();
  });

  it("should return a rate given an aggregator", async () => {
    const aggregator = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"; //ETH_USD
    const oracleData = await chainlinkOracleContract.getDataParameter(
      aggregator,
      EMPTY_ADDRESS,
      (10 ** 18).toString()
    );
    const [success, rate] = await chainlinkOracleContract.peek(oracleData);
    console.log(`Rate is ${rate}`);
    expect(success).to.be.true;
    expect(rate).to.be.gt(1, "Invalid rate");
  });
});

async function mockContracts() {
  chainlinkOracleCF = await ethers.getContractFactory("ChainlinkOracle");
  chainlinkOracleContract = await chainlinkOracleCF.connect(owner).deploy();
}
