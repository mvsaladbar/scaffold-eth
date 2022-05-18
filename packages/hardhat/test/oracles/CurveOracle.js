const { ethers } = require("hardhat");
const chai = require("chai");
const { fork_network } = require("../utils/network_fork");
const { solidity } = require("ethereum-waffle");

let owner, curveOracleContract;

chai.use(solidity);
let expect = chai.expect;

describe("Curve Oracle", async () => {
  before(async () => {
    fork_network();
    [owner] = await ethers.getSigners();
    await mockContracts();
  });

  it("should return a rate from LP 3pool to USD", async () => {
    pool = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; //3pool
    oracleData = curveOracleContract.getDataParameter(pool);
    const [success, rate] = await curveOracleContract.peek(oracleData);
    console.log(`Rate is ${rate}`);
    expect(success).to.be.true;
    expect(rate).to.be.gt(1, "Invalid rate");
  });

  it("should fail if the pool does not exist", async () => {
    pool = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; //Not an actual pool!
    oracleData = curveOracleContract.getDataParameter(pool);
    expect(curveOracleContract.peek(oracleData)).to.be.reverted;
  });
});

async function mockContracts() {
  const curveOracleCF = await ethers.getContractFactory("CurveOracle");
  curveOracleContract = await curveOracleCF.connect(owner).deploy();
}
