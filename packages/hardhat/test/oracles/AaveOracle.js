const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { EMPTY_BYTES } = require("../utils/constants");
const { fork_network } = require("../utils/network_fork");

let owner;
let aaveOracleContract;

chai.use(solidity);
let expect = chai.expect;

describe("Aave Oracle", async () => {
  before(async () => {
    fork_network();
    [owner] = await ethers.getSigners();
    await mockContracts();
  });

  it("should return a fix rate for Aave tokens", async () => {
    const [success, fixedRate] = await aaveOracleContract.peek(EMPTY_BYTES);
    console.log(`Rate is ${fixedRate}`);
    expect(success).to.be.true;
    expect(fixedRate).to.be.eq((10 ** 18).toString(), "Wrong rate");
  });
});

async function mockContracts() {
  const aaveOracleCF = await ethers.getContractFactory("AaveOracle");
  aaveOracleContract = await aaveOracleCF.connect(owner).deploy();
}
