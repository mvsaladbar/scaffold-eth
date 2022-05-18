const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { EMPTY_BYTES } = require("../utils/constants");
const { fork_network } = require("../utils/network_fork");

let owner, stablesOracleContract;

chai.use(solidity);
let expect = chai.expect;

describe("Stables Oracle", async () => {
  before(async () => {
    fork_network();
    [owner] = await ethers.getSigners();

    await mockContracts();
  });

  it("should return a fix rate for stablecoins", async () => {
    const [success, fixedRate] = await stablesOracleContract.peek(EMPTY_BYTES);
    expect(success).to.be.true;
    expect(fixedRate).to.be.eq((10 ** 18).toString(), "Wrong rate");
  });
});

async function mockContracts() {
  const stablesOracleCF = await ethers.getContractFactory("StablesOracle");
  stablesOracleContract = await stablesOracleCF.connect(owner).deploy();
}
