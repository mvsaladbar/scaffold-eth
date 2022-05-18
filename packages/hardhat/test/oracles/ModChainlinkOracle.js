const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { fork_network } = require("../utils/network_fork");

let owner, modChainlinkOracleContract;

chai.use(solidity);
let expect = chai.expect;

describe("modChainlink Oracle", async () => {
  before(async () => {
    fork_network();
    [owner] = await ethers.getSigners();

    await mockContracts();
  });

  it("should return the price of WETH", async () => {
    const token = process.env.WETH_ADDRESS; // WETH
    await testRate(token);
  });
  it("should return the price of WBTC", async () => {
    const token = process.env.WBTC_ADDRESS; // WBTC
    await testRate(token);
  });
  it("should return the price of AAVE", async () => {
    const token = process.env.AAVE_ADDRESS; // AAVE
    await testRate(token);
  });
  it("should return the price of UNI", async () => {
    const token = process.env.UNI_ADDRESS; // UNI
    await testRate(token);
  });
  it("should return the price of SUSHI", async () => {
    const token = process.env.SUSHI_ADDRESS; // SUSHI
    await testRate(token);
  });
  it("should return the price of CRV", async () => {
    const token = process.env.CRV_ADDRESS; // CRV
    await testRate(token);
  });
  it("should return the price of MATIC", async () => {
    const token = process.env.MATIC_ADDRESS; // MATIC
    await testRate(token);
  });
  it("should return the price of COMP", async () => {
    const token = process.env.COMP_ADDRESS; // COMP
    await testRate(token);
  });
  it("should return the price of LINK", async () => {
    const token = process.env.LINK_ADDRESS; // LINK
    await testRate(token);
  });
});

async function testRate(tokenAddress) {
  const oracleData = await modChainlinkOracleContract.getDataParameter(
    tokenAddress
  );
  const [success, rate] = await modChainlinkOracleContract.peek(oracleData);
  console.log(`Rate is ${rate}`);
  expect(success).to.be.true;
  expect(rate).to.be.gt(1, "Invalid rate");

  const peekSpotRate = await modChainlinkOracleContract.peekSpot(oracleData);
  expect(peekSpotRate).to.be.gt(1, "Invalid peekSpotRate");
}

async function mockContracts() {
  const modChainlinkOracleCF = await ethers.getContractFactory(
    "ModChainlinkOracle"
  );
  modChainlinkOracleContract = await modChainlinkOracleCF
    .connect(owner)
    .deploy();
}
