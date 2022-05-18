const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { fork_network } = require("../utils/network_fork");

let owner, yearnOracleContract;

chai.use(solidity);
let expect = chai.expect;

describe("Yearn Oracle", async () => {
  before(async () => {
    fork_network();
    [owner] = await ethers.getSigners();
    await mockContracts();
  });

  it("should return a rate from yvUSDT to USD", async () => {
    vault = "0x7Da96a3891Add058AdA2E826306D812C638D87a7"; //yearn vault of USDT
    oracleData = yearnOracleContract.getDataParameter(vault);
    const [success, rate] = await yearnOracleContract.peek(oracleData);
    console.log(`Rate is ${rate}`);
    expect(success).to.be.true;
    expect(parseInt(rate)).to.greaterThan(1e18, "Invalid rate");
  });

  it("should fail if the vault does not exist", async () => {
    vault = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; //Not an actual vault!
    oracleData = yearnOracleContract.getDataParameter(vault);
    expect(yearnOracleContract.peek(oracleData)).to.be.reverted;
  });
});

async function mockContracts() {
  const yearnOracleCF = await ethers.getContractFactory("YearnOracle");
  yearnOracleContract = await yearnOracleCF.connect(owner).deploy();
}
